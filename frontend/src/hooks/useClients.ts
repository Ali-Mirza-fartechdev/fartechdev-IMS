import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Client } from '@/types/database'
import type { ClientFormValues } from '@/lib/validation'
import toast from 'react-hot-toast'

export function useClients(search = '') {
  return useQuery({
    queryKey: ['clients', search],
    queryFn: async () => {
      let query = supabase.from('clients').select('*').order('created_at', { ascending: false })
      if (search) {
        query = query.or(
          `name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
        )
      }
      const { data, error } = await query
      if (error) throw error
      return data as Client[]
    },
  })
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
      if (error) throw error
      return data as Client
    },
    enabled: !!id,
  })
}

export function useClientStats(id: string | undefined) {
  return useQuery({
    queryKey: ['clients', id, 'stats'],
    queryFn: async () => {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('grand_total, amount_paid, balance_due, status, invoice_date, invoice_number')
        .eq('client_id', id)
        .order('invoice_date', { ascending: false })
      if (error) throw error

      const totalInvoices = invoices.length
      const paidAmount = invoices
        .filter((i) => i.status === 'paid' || i.status === 'delivered')
        .reduce((sum, i) => sum + Number(i.grand_total), 0)
      const pendingAmount = invoices
        .filter((i) => !['draft', 'cancelled', 'paid', 'delivered'].includes(i.status))
        .reduce((sum, i) => sum + Number(i.balance_due), 0)
      const lastInvoice = invoices[0]?.invoice_number ?? null

      return { totalInvoices, paidAmount, pendingAmount, lastInvoice }
    },
    enabled: !!id,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: ClientFormValues) => {
      // Duplicate prevention: same name + email combination
      if (values.email) {
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .eq('email', values.email)
          .maybeSingle()
        if (existing) throw new Error('A client with this email already exists')
      }
      const { data, error } = await supabase.from('clients').insert(values).select().single()
      if (error) throw error
      return data as Client
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client created')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<ClientFormValues> }) => {
      const { data, error } = await supabase.from('clients').update(values).eq('id', id).select().single()
      if (error) throw error
      return data as Client
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
