import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Invoice, InvoiceStatus } from '@/types/database'
import type { InvoiceFormValues } from '@/lib/validation'
import toast from 'react-hot-toast'

export interface InvoiceFilters {
  search?: string
  status?: InvoiceStatus | 'all'
  clientId?: string
  dateFrom?: string
  dateTo?: string
  country?: string
}

export function useInvoices(filters: InvoiceFilters = {}, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['invoices', filters, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select('*, client:clients(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status)
      if (filters.clientId) query = query.eq('client_id', filters.clientId)
      if (filters.dateFrom) query = query.gte('invoice_date', filters.dateFrom)
      if (filters.dateTo) query = query.lte('invoice_date', filters.dateTo)
      if (filters.search) query = query.ilike('invoice_number', `%${filters.search}%`)

      const { data, error, count } = await query
      if (error) throw error
      return { invoices: data as Invoice[], total: count ?? 0 }
    },
  })
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, client:clients(*), items:invoice_items(*), payments(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Invoice
    },
    enabled: !!id,
  })
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: InvoiceFormValues) => {
      const { items, ...invoiceFields } = values

      const { data: invoice, error: invErr } = await supabase
        .from('invoices')
        .insert({ ...invoiceFields, subtotal: 0, tax: 0, grand_total: 0, amount_paid: 0 })
        .select()
        .single()
      if (invErr) throw invErr

      const itemsPayload = items.map((item, idx) => ({
        invoice_id: invoice.id,
        service_name: item.service_name,
        description: item.description ?? null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        sort_order: idx,
      }))

      const { error: itemsErr } = await supabase.from('invoice_items').insert(itemsPayload)
      if (itemsErr) throw itemsErr

      return invoice as Invoice
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['revenue'] })
      toast.success('Invoice created')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: InvoiceFormValues
    }) => {
      const { items, ...invoiceFields } = values

      const { error: invErr } = await supabase.from('invoices').update(invoiceFields).eq('id', id)
      if (invErr) throw invErr

      // Replace items wholesale — simpler and safe under a DB transparty trigger
      const { error: delErr } = await supabase.from('invoice_items').delete().eq('invoice_id', id)
      if (delErr) throw delErr

      const itemsPayload = items.map((item, idx) => ({
        invoice_id: id,
        service_name: item.service_name,
        description: item.description ?? null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        sort_order: idx,
      }))
      const { error: itemsErr } = await supabase.from('invoice_items').insert(itemsPayload)
      if (itemsErr) throw itemsErr
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['invoices', variables.id] })
      qc.invalidateQueries({ queryKey: ['revenue'] })
      toast.success('Invoice updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceStatus }) => {
      const { error } = await supabase.from('invoices').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['revenue'] })
      toast.success('Status updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
