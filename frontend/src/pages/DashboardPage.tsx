import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { useRevenueSummaryByCurrency, useMonthlyRevenue, useInvoiceStatusCounts, useRecentActivity } from '@/hooks/useRevenue'
import { Card, Skeleton } from '@/components/ui/primitives'
import { formatCurrency, formatDate, STATUS_LABELS } from '@/lib/utils'
import { DollarSign, Clock, CheckCircle2, TrendingUp, Wallet, Calendar } from 'lucide-react'

const STATUS_ORDER = ['draft', 'sent', 'pending_approval', 'approved', 'pending_payment', 'paid', 'delivered', 'cancelled']
const PIE_COLORS = ['#6B7280', '#2563EB', '#F59E0B', '#6366F1', '#F97316', '#22C55E', '#10B981', '#EF4444']

export default function DashboardPage() {
  const { data: summaries, isLoading: loadingSummary } = useRevenueSummaryByCurrency()
  const { data: statusCounts, isLoading: loadingStatus } = useInvoiceStatusCounts()
  const { data: activity, isLoading: loadingActivity } = useRecentActivity()

  const [selectedCurrency, setSelectedCurrency] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (summaries && summaries.length > 0 && !selectedCurrency) {
      setSelectedCurrency(summaries[0].currency)
    }
  }, [summaries, selectedCurrency])

  const { data: monthly, isLoading: loadingMonthly } = useMonthlyRevenue(selectedCurrency)

  const activeSummary = summaries?.find((s) => s.currency === selectedCurrency)

  const revenueCards = [
    { label: 'Total Revenue', value: activeSummary?.total_revenue, icon: DollarSign },
    { label: 'Pending Revenue', value: activeSummary?.pending_revenue, icon: Clock },
    { label: 'Paid Revenue', value: activeSummary?.paid_revenue, icon: CheckCircle2 },
    { label: 'Outstanding Revenue', value: activeSummary?.outstanding_revenue, icon: TrendingUp },
    { label: 'This Month', value: activeSummary?.this_month_revenue, icon: Calendar },
    { label: 'This Year', value: activeSummary?.this_year_revenue, icon: Wallet },
  ]

  const totalInvoices = statusCounts ? Object.values(statusCounts).reduce((a, b) => a + b, 0) : 0
  const pieData = STATUS_ORDER.filter((s) => statusCounts?.[s]).map((s) => ({
    name: STATUS_LABELS[s],
    value: statusCounts![s],
  }))

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Overview of revenue and invoice activity</p>
        </div>

        {summaries && summaries.length > 1 && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-panel p-1">
            {summaries.map((s) => (
              <button
                key={s.currency}
                onClick={() => setSelectedCurrency(s.currency)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedCurrency === s.currency ? 'bg-accent text-white' : 'text-muted hover:text-white'
                }`}
              >
                {s.currency}
              </button>
            ))}
          </div>
        )}
      </div>

      {summaries && summaries.length > 1 && (
        <p className="mt-3 rounded-xl bg-accent/10 px-4 py-2 text-xs text-accent-light">
          You have invoices in {summaries.length} currencies. Revenue is shown per-currency — totals are not
          converted or blended together, since exchange rates fluctuate and this system doesn't assume a rate.
        </p>
      )}

      {/* Revenue Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {revenueCards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="!p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">{label}</p>
              <Icon className="h-4 w-4 text-accent-light" />
            </div>
            {loadingSummary ? (
              <Skeleton className="mt-2 h-6 w-24" />
            ) : (
              <p className="mt-2 text-lg font-bold text-white">
                {formatCurrency(value ?? 0, selectedCurrency ?? 'USD')}
              </p>
            )}
          </Card>
        ))}
      </div>

      {/* Invoice Status Cards */}
      <div className="mt-4 grid grid-cols-3 gap-4 md:grid-cols-4 xl:grid-cols-9">
        <Card className="!p-4">
          <p className="text-xs text-muted">Total Invoices</p>
          <p className="mt-2 text-lg font-bold text-white">{loadingStatus ? '—' : totalInvoices}</p>
        </Card>
        {STATUS_ORDER.map((s) => (
          <Card key={s} className="!p-4">
            <p className="text-xs text-muted">{STATUS_LABELS[s]}</p>
            <p className="mt-2 text-lg font-bold text-white">{loadingStatus ? '—' : statusCounts?.[s] ?? 0}</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-white">
            Monthly Revenue {selectedCurrency ? `(${selectedCurrency})` : ''}
          </h3>
          {loadingMonthly ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short' })}
                  stroke="#9A9A9A"
                  fontSize={12}
                />
                <YAxis stroke="#9A9A9A" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: 8 }}
                  formatter={(v: number) => formatCurrency(v, selectedCurrency ?? 'USD')}
                />
                <Bar dataKey="revenue" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-white">Invoice Status</h3>
          {loadingStatus ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mt-6">
        <h3 className="mb-4 text-sm font-semibold text-white">Latest Activity</h3>
        {loadingActivity ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : activity && activity.length > 0 ? (
          <div className="divide-y divide-border">
            {activity.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3 text-sm">
                <span className="text-white">
                  Invoice <span className="font-medium text-accent-light">{a.invoice_number}</span>{' '}
                  {STATUS_LABELS[a.status]}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-muted">{formatCurrency(a.grand_total, a.currency)}</span>
                  <span className="text-xs text-muted">{formatDate(a.updated_at)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No activity yet.</p>
        )}
      </Card>
    </div>
  )
}
