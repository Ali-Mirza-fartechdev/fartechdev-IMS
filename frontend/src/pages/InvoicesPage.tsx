import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, FileText, Trash2 } from 'lucide-react'
import { useInvoices, useDeleteInvoice, type InvoiceFilters } from '@/hooks/useInvoices'
import { useClients } from '@/hooks/useClients'
import { Button, Input, Select, Card, Skeleton, EmptyState, Badge } from '@/components/ui/primitives'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import type { Invoice, InvoiceStatus } from '@/types/database'

const STATUS_OPTIONS: (InvoiceStatus | 'all')[] = [
  'all', 'draft', 'sent', 'pending_approval', 'approved', 'pending_payment', 'paid', 'delivered', 'cancelled',
]

export default function InvoicesPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<InvoiceFilters>({ status: 'all' })
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null)

  const { data, isLoading } = useInvoices(filters, page, 20)
  const { data: clients } = useClients()
  const deleteInvoice = useDeleteInvoice()

  const totalPages = data ? Math.max(1, Math.ceil(data.total / 20)) : 1

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="mt-1 text-sm text-muted">Create, track, and manage invoices</p>
        </div>
        <Button onClick={() => navigate('/invoices/new')}>
          <Plus className="h-4 w-4" /> New Invoice
        </Button>
      </div>

      <div className="mt-6 flex flex-nowrap items-end gap-3 overflow-x-auto pb-1">
        <div className="relative w-56 shrink-0">
          <label className="mb-1.5 block text-xs font-medium text-muted">Search</label>
          <Search className="absolute left-3 top-[38px] h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Invoice #..."
            className="h-[42px] pl-9"
            value={filters.search ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>
        <div className="w-40 shrink-0">
          <label className="mb-1.5 block text-xs font-medium text-muted">Status</label>
          <Select
            className="h-[42px]"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as InvoiceStatus | 'all' }))}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : STATUS_LABELS[s]}</option>
            ))}
          </Select>
        </div>
        <div className="w-40 shrink-0">
          <label className="mb-1.5 block text-xs font-medium text-muted">Client</label>
          <Select
            className="h-[42px]"
            value={filters.clientId ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, clientId: e.target.value || undefined }))}
          >
            <option value="">All Clients</option>
            {clients?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div className="w-36 shrink-0">
          <label className="mb-1.5 block text-xs font-medium text-muted">From</label>
          <Input
            type="date"
            className="h-[42px]"
            value={filters.dateFrom ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))}
          />
        </div>
        <div className="w-36 shrink-0">
          <label className="mb-1.5 block text-xs font-medium text-muted">To</label>
          <Input
            type="date"
            className="h-[42px]"
            value={filters.dateTo ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))}
          />
        </div>
        {(filters.search || (filters.status && filters.status !== 'all') || filters.clientId || filters.dateFrom || filters.dateTo) && (
          <Button variant="ghost" className="h-[42px] shrink-0" onClick={() => setFilters({ status: 'all' })}>
            Clear
          </Button>
        )}
      </div>

      <Card className="mt-6 !p-0 overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-5">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : data && data.invoices.length > 0 ? (
          <>
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Invoice #</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Due</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                  <th className="px-5 py-3 font-medium text-right">Balance</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/5">
                    <td className="px-5 py-3">
                      <Link to={`/invoices/${inv.id}`} className="font-medium text-accent-light">{inv.invoice_number}</Link>
                    </td>
                    <td className="px-5 py-3 text-white">{inv.client?.name ?? inv.client_name_snapshot ?? '— (client deleted)'}</td>
                    <td className="px-5 py-3 text-muted">{formatDate(inv.invoice_date)}</td>
                    <td className="px-5 py-3 text-muted">{formatDate(inv.due_date)}</td>
                    <td className="px-5 py-3"><Badge className={STATUS_COLORS[inv.status]}>{STATUS_LABELS[inv.status]}</Badge></td>
                    <td className="px-5 py-3 text-right text-white">{formatCurrency(inv.grand_total, inv.currency)}</td>
                    <td className="px-5 py-3 text-right text-muted">{formatCurrency(inv.balance_due, inv.currency)}</td>
                    <td className="px-5 py-3">
                      {inv.status === 'draft' && (
                        <button onClick={() => setDeleteTarget(inv)} className="rounded-lg p-1.5 text-muted hover:bg-danger/15 hover:text-danger">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm text-muted">
              <span>Page {page} of {totalPages} ({data.total} invoices)</span>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={FileText}
              title="No invoices found"
              description="Create your first invoice to start tracking revenue."
              action={<Button onClick={() => navigate('/invoices/new')}><Plus className="h-4 w-4" /> New Invoice</Button>}
            />
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete draft invoice?"
        description={`Invoice ${deleteTarget?.invoice_number} will be permanently deleted.`}
        confirmLabel="Delete"
        loading={deleteInvoice.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await deleteInvoice.mutateAsync(deleteTarget.id)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
