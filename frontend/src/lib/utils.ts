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
