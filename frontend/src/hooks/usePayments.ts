import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Payment } from '@/types/database'
import type { PaymentFormValues } from '@/lib/validation'
import toast from 'react-hot-toast'

export function usePayments(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ['payments', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false })
      if (error) throw error
      return data as Payment[]
    },
    enabled: !!invoiceId,
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: PaymentFormValues) => {
      const { data, error } = await supabase.from('payments').insert(values).select().single()
      if (error) throw error
      return data as Payment
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['payments', variables.invoice_id] })
      qc.invalidateQueries({ queryKey: ['invoices', variables.invoice_id] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['revenue'] })
      toast.success('Payment recorded')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeletePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; invoiceId: string }) => {
      const { error } = await supabase.from('payments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['payments', variables.invoiceId] })
      qc.invalidateQueries({ queryKey: ['invoices', variables.invoiceId] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['revenue'] })
      toast.success('Payment removed')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
