import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { invoiceSchema, type InvoiceFormValues } from '@/lib/validation'
import { useClients } from '@/hooks/useClients'
import { useInvoice, useCreateInvoice, useUpdateInvoice } from '@/hooks/useInvoices'
import { useSettings } from '@/hooks/useSettings'
import { Button, Input, Select, Textarea, Card } from '@/components/ui/primitives'
import { formatCurrency, CURRENCIES } from '@/lib/utils'

export default function InvoiceFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()

  const { data: clients } = useClients()
  const { data: settings } = useSettings()
  const { data: existing } = useInvoice(id)
  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()

  const today = new Date().toISOString().slice(0, 10)
  const defaultDue = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

  const {
    register, control, handleSubmit, watch, reset, formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_id: '',
      invoice_date: today,
      due_date: defaultDue,
      currency: settings?.default_currency ?? 'USD',
      discount: 0,
      status: 'draft',
      items: [{ service_name: '', description: '', quantity: 1, unit_price: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => {
    if (existing) {
      reset({
        client_id: existing.client_id ?? '',
        invoice_date: existing.invoice_date,
        due_date: existing.due_date,
        currency: existing.currency,
        discount: existing.discount,
        status: existing.status,
        notes: existing.notes ?? '',
        items: existing.items?.length
          ? existing.items.map((i) => ({
              service_name: i.service_name,
              description: i.description ?? '',
              quantity: i.quantity,
              unit_price: i.unit_price,
            }))
          : [{ service_name: '', description: '', quantity: 1, unit_price: 0 }],
      })
    }
  }, [existing, reset])

  const items = watch('items')
  const currency = watch('currency') || 'USD'
  const discount = watch('discount') || 0
  const taxRate = settings?.tax_percentage ?? 0
  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0)
  const tax = (subtotal * taxRate) / 100
  const grandTotal = subtotal + tax - discount

  const readOnly = existing?.status === 'delivered'

  const onSubmit = async (values: InvoiceFormValues) => {
    if (isEdit && id) {
      await updateInvoice.mutateAsync({ id, values })
      navigate(`/invoices/${id}`)
    } else {
      const inv = await createInvoice.mutateAsync(values)
      navigate(`/invoices/${inv.id}`)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <button onClick={() => navigate('/invoices')} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Invoices
      </button>
      <h1 className="mt-4 text-2xl font-bold text-white">{isEdit ? `Edit Invoice ${existing?.invoice_number ?? ''}` : 'New Invoice'}</h1>

      {readOnly && (
        <p className="mt-2 rounded-xl bg-danger/10 px-4 py-2 text-sm text-danger">
          This invoice is Delivered and locked from editing.
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-white">Invoice Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Select label="Client" error={errors.client_id?.message} disabled={readOnly} {...register('client_id')}>
              <option value="">Select client...</option>
              {clients?.map((c) => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
            </Select>
            <Input label="Invoice Date" type="date" disabled={readOnly} error={errors.invoice_date?.message} {...register('invoice_date')} />
            <Input label="Due Date" type="date" disabled={readOnly} error={errors.due_date?.message} {...register('due_date')} />
            <Select label="Currency" disabled={readOnly} {...register('currency')}>
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </Select>
            <Select label="Status" disabled={readOnly} {...register('status')}>
              {['draft', 'sent', 'pending_approval', 'approved', 'pending_payment', 'paid', 'delivered', 'cancelled'].map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </Select>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Invoice Items</h3>
            {!readOnly && (
              <Button type="button" variant="secondary" onClick={() => append({ service_name: '', description: '', quantity: 1, unit_price: 0 })}>
                <Plus className="h-4 w-4" /> Add Row
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-1 gap-3 rounded-xl border border-border p-3 sm:grid-cols-12">
                <div className="sm:col-span-4">
                  <Input placeholder="Service name" disabled={readOnly} {...register(`items.${idx}.service_name`)} error={errors.items?.[idx]?.service_name?.message} />
                </div>
                <div className="sm:col-span-3">
                  <Input placeholder="Description" disabled={readOnly} {...register(`items.${idx}.description`)} />
                </div>
                <div className="sm:col-span-2">
                  <Input type="number" step="1" min="1" placeholder="Qty" disabled={readOnly} {...register(`items.${idx}.quantity`)} error={errors.items?.[idx]?.quantity?.message} />
                </div>
                <div className="sm:col-span-2">
                  <Input type="number" step="0.01" min="0" placeholder="Unit price" disabled={readOnly} {...register(`items.${idx}.unit_price`)} error={errors.items?.[idx]?.unit_price?.message} />
                </div>
                <div className="flex items-center justify-end sm:col-span-1">
                  {!readOnly && fields.length > 1 && (
                    <button type="button" onClick={() => remove(idx)} className="rounded-lg p-2 text-muted hover:bg-danger/15 hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {errors.items && typeof errors.items.message === 'string' && (
            <p className="mt-2 text-xs text-danger">{errors.items.message}</p>
          )}

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between text-muted"><span>Subtotal</span><span>{formatCurrency(subtotal, currency)}</span></div>
              <div className="flex justify-between text-muted"><span>Tax ({taxRate}%)</span><span>{formatCurrency(tax, currency)}</span></div>
              <div className="flex items-center justify-between text-muted">
                <span>Discount</span>
                <input
                  type="number" step="0.01" min="0" disabled={readOnly}
                  className="w-24 rounded-lg border border-border bg-panel px-2 py-1 text-right text-white"
                  {...register('discount')}
                />
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-white">
                <span>Grand Total</span><span className="text-accent-light">{formatCurrency(grandTotal, currency)}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <Textarea label="Notes" rows={3} disabled={readOnly} {...register('notes')} />
        </Card>

        {!readOnly && (
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => navigate('/invoices')}>Cancel</Button>
            <Button type="submit" loading={createInvoice.isPending || updateInvoice.isPending}>
              {isEdit ? 'Save Changes' : 'Create Invoice'}
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
