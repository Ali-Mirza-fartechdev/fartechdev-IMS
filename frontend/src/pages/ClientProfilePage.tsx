import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { useClient, useClientStats } from '@/hooks/useClients'
import { useInvoices } from '@/hooks/useInvoices'
import { Card, Skeleton, Badge } from '@/components/ui/primitives'
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { data: client, isLoading } = useClient(id)
  const { data: stats } = useClientStats(id)
  const { data: invoiceData } = useInvoices({ clientId: id }, 1, 50)

  if (isLoading || !client) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <Link to="/clients" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Clients
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-white">{client.name}</h1>
      <p className="text-sm text-muted">{client.company}</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-white">Client Details</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Email" value={client.email} />
            <Row label="Phone" value={client.phone} />
            <Row label="WhatsApp" value={client.whatsapp} />
            <Row label="Country" value={client.country} />
            <Row label="Address" value={client.address} />
            <Row label="Tax Number" value={client.tax_number} />
          </dl>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-white">Financial Summary</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Total Invoices" value={stats?.totalInvoices?.toString()} />
            <Row label="Paid Amount" value={formatCurrency(stats?.paidAmount ?? 0)} />
            <Row label="Pending Amount" value={formatCurrency(stats?.pendingAmount ?? 0)} />
            <Row label="Last Invoice" value={stats?.lastInvoice} />
          </dl>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-white">Notes</h3>
          <p className="text-sm text-muted">{client.notes || 'No notes'}</p>
        </Card>
      </div>

      <Card className="mt-6 !p-0 overflow-hidden">
        <h3 className="p-5 pb-0 text-sm font-semibold text-white">Invoice History</h3>
        {invoiceData?.invoices.length ? (
          <table className="mt-4 w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Invoice #</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoiceData.invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/5">
                  <td className="px-5 py-3">
                    <Link to={`/invoices/${inv.id}`} className="font-medium text-accent-light">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted">{formatDate(inv.invoice_date)}</td>
                  <td className="px-5 py-3">
                    <Badge className={STATUS_COLORS[inv.status]}>{STATUS_LABELS[inv.status]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right text-white">{formatCurrency(inv.grand_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-5">
            <p className="flex items-center gap-2 text-sm text-muted"><FileText className="h-4 w-4" /> No invoices yet</p>
          </div>
        )}
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="text-white">{value || '—'}</dd>
    </div>
  )
}
