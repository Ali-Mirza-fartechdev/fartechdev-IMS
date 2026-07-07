import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { RevenueSummary, MonthlyRevenue, RevenueByClient, Invoice } from '@/types/database'

export interface CurrencyRevenueSummary extends RevenueSummary {
  currency: string
}

export function useRevenueSummaryByCurrency() {
  return useQuery({
    queryKey: ['revenue', 'summary-by-currency'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_revenue_summary_by_currency')
        .select('*')
        .order('total_revenue', { ascending: false })
      if (error) throw error
      return data as CurrencyRevenueSummary[]
    },
  })
}

export function useMonthlyRevenue(currency: string | undefined) {
  return useQuery({
    queryKey: ['revenue', 'monthly', currency],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_monthly_revenue')
        .select('*')
        .eq('currency', currency)
        .order('month', { ascending: true })
      if (error) throw error
      return data as (MonthlyRevenue & { currency: string })[]
    },
    enabled: !!currency,
  })
}

export function useRevenueByClient() {
  return useQuery({
    queryKey: ['revenue', 'by-client'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_revenue_by_client')
        .select('*')
        .order('paid_revenue', { ascending: false })
      if (error) throw error
      return data as (RevenueByClient & { currency: string })[]
    },
  })
}

export function useInvoiceStatusCounts() {
  return useQuery({
    queryKey: ['invoices', 'status-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('invoices').select('status')
      if (error) throw error
      const counts: Record<string, number> = {}
      data.forEach((row) => {
        counts[row.status] = (counts[row.status] ?? 0) + 1
      })
      return counts
    },
  })
}

export function useRecentActivity(limit = 8) {
  return useQuery({
    queryKey: ['invoices', 'recent-activity', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, status, updated_at, grand_total, currency')
        .order('updated_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as Pick<Invoice, 'id' | 'invoice_number' | 'status' | 'updated_at' | 'grand_total' | 'currency'>[]
    },
  })
}
