import { useEffect, useMemo, useState } from 'react'
import { useInvoices } from '@/hooks/useInvoices'
import { useRevenueByClient, useMonthlyRevenue } from '@/hooks/useRevenue'
import { Card, Select, Button } from '@/components/ui/primitives'
import { formatCurrency, formatDate, STATUS_LABELS } from '@/lib/utils'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'

type ReportType = 'revenue' | 'invoices' | 'pending_payments' | 'paid_invoices' | 'outstanding' | 'by_client'

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('revenue')
  const { data: invoiceData } = useInvoices({}, 1, 1000)
  const { data: byClient } = useRevenueByClient()
  const [monthlyCurrency, setMonthlyCurrency] = useState('USD')
  const { data: monthly } = useMonthlyRevenue(monthlyCurrency)
  const availableCurrencies = useMemo(
    () => Array.from(new Set((invoiceData?.invoices ?? []).map((i) => i.currency))),
    [invoiceData]
  )

  useEffect(() => {
    if (availableCurrencies.length > 0 && !availableCurrencies.includes(monthlyCurrency)) {
      setMonthlyCurrency(availableCurrencies[0])
    }
  }, [availableCurrencies, monthlyCurrency])

  const rows = useMemo(() => {
    const invoices = invoiceData?.invoices ?? []
    switch (reportType) {
      case 'pending_payments':
        return invoices.filter((i) => ['approved', 'pending_payment'].includes(i.status))
      case 'paid_invoices':
        return invoices.filter((i) => ['paid', 'delivered'].includes(i.status))
      case 'outstanding':
        return invoices.filter((i) => i.balance_due > 0 && i.status !== 'cancelled')
      case 'invoices':
        return invoices
      default:
        return invoices
    }
  }, [invoiceData, reportType])

  const exportCSV = () => {
    const csvRows = [
      ['Invoice #', 'Client', 'Date', 'Status', 'Total', 'Paid', 'Balance'],
      ...rows.map((r) => [r.invoice_number, r.client?.name ?? '', r.invoice_date, STATUS_LABELS[r.status], r.grand_total, r.amount_paid, r.balance_due]),
    ]
    const csv = csvRows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportType}_report.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportExcel = () => {
    const data = rows.map((r) => ({
      'Invoice #': r.invoice_number,
      Client: r.client?.name,
      Date: r.invoice_date,
      Status: STATUS_LABELS[r.status],
      Total: r.grand_total,
      Paid: r.amount_paid,
      Balance: r.balance_due,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report')
    XLSX.writeFile(wb, `${reportType}_report.xlsx`)
  }

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-white">Reports</h1>
      <p className="mt-1 text-sm text-muted">Revenue and invoice reporting</p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Select className="w-64" value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)}>
          <option value="revenue">Monthly Revenue Report</option>
          <option value="invoices">Invoice Report</option>
          <option value="pending_payments">Pending Payments</option>
          <option value="paid_invoices">Paid Invoices</option>
          <option value="outstanding">Outstanding Revenue</option>
          <option value="by_client">Revenue by Client</option>
        </Select>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportCSV}><Download className="h-4 w-4" /> CSV</Button>
          <Button variant="secondary" onClick={exportExcel}><Download className="h-4 w-4" /> Excel</Button>
        </div>
      </div>

      {reportType === 'revenue' && (
        <>
          {availableCurrencies.length > 1 && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-panel p-1 w-fit">
              {availableCurrencies.map((cur) => (
                <button
                  key={cur}
                  onClick={() => setMonthlyCurrency(cur)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    monthlyCurrency === cur ? 'bg-accent text-white' : 'text-muted hover:text-white'
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>
          )}
          <Card className="mt-4 !p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs text-muted">
                <tr><th className="px-5 py-3">Month</th><th className="px-5 py-3 text-right">Revenue ({monthlyCurrency})</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthly?.map((m) => (
                  <tr key={m.month}><td className="px-5 py-3 text-white">{formatDate(m.month)}</td><td className="px-5 py-3 text-right text-white">{formatCurrency(m.revenue, monthlyCurrency)}</td></tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {reportType === 'by_client' && (
        <Card className="mt-6 !p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted">
              <tr><th className="px-5 py-3">Client</th><th className="px-5 py-3">Currency</th><th className="px-5 py-3 text-right">Paid Revenue</th><th className="px-5 py-3 text-right">Outstanding</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {byClient?.filter((c) => c.currency).map((c) => (
                <tr key={`${c.client_id}-${c.currency}`}>
                  <td className="px-5 py-3 text-white">{c.client_name}</td>
                  <td className="px-5 py-3 text-muted">{c.currency}</td>
                  <td className="px-5 py-3 text-right text-white">{formatCurrency(c.paid_revenue ?? 0, c.currency)}</td>
                  <td className="px-5 py-3 text-right text-muted">{formatCurrency(c.outstanding ?? 0, c.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {['invoices', 'pending_payments', 'paid_invoices', 'outstanding'].includes(reportType) && (
        <Card className="mt-6 !p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted">
              <tr>
                <th className="px-5 py-3">Invoice #</th><th className="px-5 py-3">Client</th><th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Total</th><th className="px-5 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 text-accent-light">{r.invoice_number}</td>
                  <td className="px-5 py-3 text-white">{r.client?.name}</td>
                  <td className="px-5 py-3 text-muted">{formatDate(r.invoice_date)}</td>
                  <td className="px-5 py-3 text-muted">{STATUS_LABELS[r.status]}</td>
                  <td className="px-5 py-3 text-right text-white">{formatCurrency(r.grand_total, r.currency)}</td>
                  <td className="px-5 py-3 text-right text-muted">{formatCurrency(r.balance_due, r.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
