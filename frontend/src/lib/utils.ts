import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  pending_payment: 'Pending Payment',
  paid: 'Paid',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/15 text-gray-300 border-gray-500/30',
  sent: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  pending_approval: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  approved: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  pending_payment: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  paid: 'bg-green-500/15 text-green-300 border-green-500/30',
  delivered: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-red-500/15 text-red-300 border-red-500/30',
}

export function generateSequenceHint(prefix: string): string {
  const year = new Date().getFullYear()
  return `${prefix}-${year}-XXXX`
}

export const CURRENCIES = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'PKR', label: 'PKR — Pakistani Rupee' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'AED', label: 'AED — UAE Dirham' },
  { code: 'SAR', label: 'SAR — Saudi Riyal' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'INR', label: 'INR — Indian Rupee' },
  { code: 'CNY', label: 'CNY — Chinese Yuan' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
  { code: 'CHF', label: 'CHF — Swiss Franc' },
  { code: 'SGD', label: 'SGD — Singapore Dollar' },
  { code: 'HKD', label: 'HKD — Hong Kong Dollar' },
  { code: 'NZD', label: 'NZD — New Zealand Dollar' },
  { code: 'ZAR', label: 'ZAR — South African Rand' },
  { code: 'TRY', label: 'TRY — Turkish Lira' },
  { code: 'QAR', label: 'QAR — Qatari Riyal' },
  { code: 'KWD', label: 'KWD — Kuwaiti Dinar' },
  { code: 'BHD', label: 'BHD — Bahraini Dinar' },
  { code: 'OMR', label: 'OMR — Omani Rial' },
  { code: 'SEK', label: 'SEK — Swedish Krona' },
  { code: 'NOK', label: 'NOK — Norwegian Krone' },
  { code: 'DKK', label: 'DKK — Danish Krone' },
  { code: 'MYR', label: 'MYR — Malaysian Ringgit' },
  { code: 'THB', label: 'THB — Thai Baht' },
  { code: 'IDR', label: 'IDR — Indonesian Rupiah' },
  { code: 'PHP', label: 'PHP — Philippine Peso' },
  { code: 'BDT', label: 'BDT — Bangladeshi Taka' },
  { code: 'EGP', label: 'EGP — Egyptian Pound' },
]
