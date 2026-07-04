import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { settingsSchema, type SettingsFormValues } from '@/lib/validation'
import { useSettings, useUpdateSettings, uploadBrandingAsset } from '@/hooks/useSettings'
import { Button, Input, Textarea, Card } from '@/components/ui/primitives'
import { Upload } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { data: settings } = useSettings()
  const updateSettings = useUpdateSettings()
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingSig, setUploadingSig] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  })

  useEffect(() => {
    if (settings) {
      reset({
        company_name: settings.company_name,
        email: settings.email ?? '',
        phone: settings.phone ?? '',
        website: settings.website ?? '',
        address: settings.address ?? '',
        bank_details: settings.bank_details ?? '',
        default_currency: settings.default_currency,
        tax_percentage: settings.tax_percentage,
        invoice_prefix: settings.invoice_prefix,
        finance_head_name: settings.finance_head_name,
      })
    }
  }, [settings, reset])

  const onSubmit = async (values: SettingsFormValues) => {
    await updateSettings.mutateAsync(values)
  }

  const onUpload = async (file: File | undefined, kind: 'logo' | 'signature') => {
    if (!file) return
    kind === 'logo' ? setUploadingLogo(true) : setUploadingSig(true)
    try {
      const url = await uploadBrandingAsset(file, kind)
      await updateSettings.mutateAsync(kind === 'logo' ? { logo_url: url } : { signature_url: url })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      kind === 'logo' ? setUploadingLogo(false) : setUploadingSig(false)
    }
  }

  if (!settings) return null

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-white">Company Settings</h1>
      <p className="mt-1 text-sm text-muted">Branding, tax, and invoice defaults</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-white">Branding</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium text-white">Company Logo</p>
              {settings.logo_url && <img src={settings.logo_url} alt="Logo" className="mb-2 h-16 w-16 rounded-lg bg-black/40 p-2" />}
              <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-border bg-panel px-3.5 py-2.5 text-sm text-white hover:bg-white/5">
                <Upload className="h-4 w-4" /> {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                <input type="file" accept="image/png" className="hidden" onChange={(e) => onUpload(e.target.files?.[0], 'logo')} />
              </label>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-white">Finance Head Signature</p>
              {settings.signature_url && <img src={settings.signature_url} alt="Signature" className="mb-2 h-16 w-28 rounded-lg bg-black/40 p-2" />}
              <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-border bg-panel px-3.5 py-2.5 text-sm text-white hover:bg-white/5">
                <Upload className="h-4 w-4" /> {uploadingSig ? 'Uploading...' : 'Upload Signature'}
                <input type="file" accept="image/png" className="hidden" onChange={(e) => onUpload(e.target.files?.[0], 'signature')} />
              </label>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-white">Company Details</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Company Name" error={errors.company_name?.message} {...register('company_name')} />
            <Input label="Finance Head Name" error={errors.finance_head_name?.message} {...register('finance_head_name')} />
            <Input label="Email" type="email" {...register('email')} />
            <Input label="Phone" {...register('phone')} />
            <Input label="Website" {...register('website')} />
            <Input label="Invoice Prefix" error={errors.invoice_prefix?.message} {...register('invoice_prefix')} />
          </div>
          <div className="mt-4">
            <Textarea label="Address" rows={2} {...register('address')} />
          </div>
          <div className="mt-4">
            <Textarea label="Bank Details" rows={3} {...register('bank_details')} />
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-white">Financial Defaults</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Default Currency" placeholder="USD" error={errors.default_currency?.message} {...register('default_currency')} />
            <Input label="Tax Percentage" type="number" step="0.01" error={errors.tax_percentage?.message} {...register('tax_percentage')} />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={updateSettings.isPending}>Save Settings</Button>
        </div>
      </form>
    </div>
  )
}
