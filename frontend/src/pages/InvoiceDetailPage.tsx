import { useParams, useNavigate, Link } from 'react-router-dom'
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer'
import { useState } from 'react'
import { ArrowLeft, Pencil, Download, Eye, Plus } from 'lucide-react'
import { useInvoice, useUpdateInvoiceStatus } from '@/hooks/useInvoices'
import { usePayments, useRecordPayment } from '@/hooks/usePayments'
import { useSettings } from '@/hooks/useSettings'
import { Button, Select, Card, Skeleton, Badge, Input } from '@/components/ui/primitives'
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import InvoicePDF from '@/components/invoices/InvoicePDF'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { paymentSchema, type PaymentFormValues } from '@/lib/validation'
import logo from '@/assets/logo.png'
import signature from '@/assets/signature.png'

const STATUS_FLOW = ['draft', 'sent', 'pending_approval', 'approved', 'pending_payment', 'paid', 'delivered', 'cancelled']

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: invoice, isLoading } = useInvoice(id)
  const { data: settings } = useSettings()
  const { data: payments } = usePayments(id)
  const updateStatus = useUpdateInvoiceStatus()
  const recordPayment = useRecordPayment()
  const [showPreview, setShowPreview] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { invoice_id: id, payment_date: new Date().toISOString().slice(0, 10), payment_method: 'bank_transfer', amount: 0 },
  })

  if (isLoading || !invoice || !settings) {
    return <div className="p-6 lg:p-8"><Skeleton className="h-96 w-full" /></div>
  }

  const onRecordPayment = async (values: PaymentFormValues) => {
    await recordPayment.mutateAsync({ ...values, invoice_id: invoice.id })
    reset({ invoice_id: invoice.id, payment_date: new Date().toISOString().slice(0, 10), payment_method: 'bank_transfer', amount: 0 })
    setShowPaymentForm(false)
  }

  return (
    <div className="p-6 lg:p-8">
      <button onClick={() => navigate('/invoices')} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Invoices
      </button>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{invoice.invoice_number}</h1>
          <Link to={`/clients/${invoice.client_id}`} className="text-sm text-accent-light">{invoice.client?.name}</Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={STATUS_COLORS[invoice.status]}>{STATUS_LABELS[invoice.status]}</Badge>
          <Select
            className="w-44"
            value={invoice.status}
            disabled={invoice.status === 'delivered'}
            onChange={(e) => updateStatus.mutate({ id: invoice.id, status: e.target.value as typeof invoice.status })}
          >
            {STATUS_FLOW.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </Select>
          {invoice.status !== 'delivered' && (
            <Button variant="secondary" onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowPreview((v) => !v)}>
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <PDFDownloadLink
            document={<InvoicePDF invoice={invoice} settings={settings} logoSrc={logo} signatureSrc={signature} />}
            fileName={`${invoice.invoice_number}.pdf`}
          >
            {({ loading }) => (
              <Button loading={loading}>
                <Download className="h-4 w-4" /> Download PDF
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {showPreview && (
        <Card className="mt-6 !p-0 overflow-hidden">
          <PDFViewer width="100%" height={700} showToolbar={false}>
            <InvoicePDF invoice={invoice} settings={settings} logoSrc={logo} signatureSrc={signature} />
          </PDFViewer>
        </Card>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 !p-0 overflow-hidden">
          <h3 className="p-5 pb-0 text-sm font-semibold text-white">Items</h3>
          <table className="mt-3 w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted">
              <tr>
                <th className="px-5 py-2 font-medium">Service</th>
                <th className="px-5 py-2 font-medium text-right">Qty</th>
                <th className="px-5 py-2 font-medium text-right">Unit Price</th>
                <th className="px-5 py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoice.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3 text-white">{item.service_name}</td>
                  <td className="px-5 py-3 text-right text-muted">{item.quantity}</td>
                  <td className="px-5 py-3 text-right text-muted">{formatCurrency(item.unit_price, invoice.currency)}</td>
                  <td className="px-5 py-3 text-right text-white">{formatCurrency(item.line_total, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end p-5">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between text-muted"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal, invoice.currency)}</span></div>
              <div className="flex justify-between text-muted"><span>Tax</span><span>{formatCurrency(invoice.tax, invoice.currency)}</span></div>
              <div className="flex justify-between text-muted"><span>Discount</span><span>-{formatCurrency(invoice.discount, invoice.currency)}</span></div>
              <div className="flex justify-between border-t border-border pt-1 font-bold text-white"><span>Grand Total</span><span>{formatCurrency(invoice.grand_total, invoice.currency)}</span></div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Payments</h3>
            <Button variant="secondary" onClick={() => setShowPaymentForm((v) => !v)}>
              <Plus className="h-4 w-4" /> Record
            </Button>
          </div>

          <div className="mb-3 flex justify-between text-sm">
            <span className="text-muted">Balance Due</span>
            <span className="font-semibold text-white">{formatCurrency(invoice.balance_due, invoice.currency)}</span>
          </div>

          {showPaymentForm && (
            <form onSubmit={handleSubmit(onRecordPayment)} className="mb-4 space-y-3 rounded-xl border border-border p-3">
              <Input type="date" label="Payment Date" error={errors.payment_date?.message} {...register('payment_date')} />
              <Select label="Method" {...register('payment_method')}>
                {['bank_transfer', 'cash', 'payoneer', 'wise', 'stripe', 'paypal', 'other'].map((m) => (
                  <option key={m} value={m}>{m.replace('_', ' ')}</option>
                ))}
              </Select>
              <Input label="Amount" type="number" step="0.01" error={errors.amount?.message} {...register('amount')} />
              <Input label="Reference #" {...register('reference_number')} />
              <Button type="submit" className="w-full" loading={recordPayment.isPending}>Save Payment</Button>
            </form>
          )}

          <div className="space-y-2">
            {payments?.map((p) => (
              <div key={p.id} className="flex justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
                <div>
                  <p className="text-white">{formatCurrency(p.amount, invoice.currency)}</p>
                  <p className="text-xs text-muted">{p.payment_method.replace('_', ' ')} · {formatDate(p.payment_date)}</p>
                </div>
              </div>
            ))}
            {!payments?.length && <p className="text-sm text-muted">No payments recorded yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
