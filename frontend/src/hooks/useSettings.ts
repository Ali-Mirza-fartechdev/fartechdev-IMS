import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Settings } from '@/types/database'
import toast from 'react-hot-toast'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single()
      if (error) throw error
      return data as Settings
    },
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Partial<Settings>) => {
      const { data, error } = await supabase.from('settings').update(values).eq('id', 1).select().single()
      if (error) throw error
      return data as Settings
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Settings saved')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export async function uploadBrandingAsset(file: File, kind: 'logo' | 'signature'): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${kind}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('branding').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('branding').getPublicUrl(path)
  return data.publicUrl
}
