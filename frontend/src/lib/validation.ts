import { z } from 'zod'

export const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  company: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().or(z.literal('')).nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  tax_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type ClientFormValues = z.infer<typeof clientSchema>

export const invoiceItemSchema = z.object({
  service_name: z.string().min(1, 'Service name required'),
  description: z.string().optional().nullable(),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unit_price: z.coerce.number().min(0, 'Unit price cannot be negative'),
})

export const invoiceSchema = z.object({
  client_id: z.string().uuid('Select a client'),
  invoice_date: z.string().min(1, 'Invoice date required'),
  due_date: z.string().min(1, 'Due date required'),
  currency: z.string().min(1).default('USD'),
  discount: z.coerce.number().min(0).default(0),
  status: z.enum([
    'draft', 'sent', 'pending_approval', 'approved',
    'pending_payment', 'paid', 'delivered', 'cancelled',
  ]),
  notes: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, 'Add at least one item'),
}).refine((data) => new Date(data.due_date) >= new Date(data.invoice_date), {
  message: 'Due date cannot be before invoice date',
  path: ['due_date'],
})

export type InvoiceFormValues = z.infer<typeof invoiceSchema>

export const paymentSchema = z.object({
  invoice_id: z.string().uuid(),
  payment_date: z.string().min(1, 'Payment date required'),
  payment_method: z.enum(['bank_transfer', 'cash', 'payoneer', 'wise', 'stripe', 'paypal', 'other']),
  reference_number: z.string().optional().nullable(),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  notes: z.string().optional().nullable(),
})

export type PaymentFormValues = z.infer<typeof paymentSchema>

export const settingsSchema = z.object({
  company_name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  bank_details: z.string().optional(),
  default_currency: z.string().min(1),
  tax_percentage: z.coerce.number().min(0).max(100),
  invoice_prefix: z.string().min(1).max(10),
  finance_head_name: z.string().min(1),
})

export type SettingsFormValues = z.infer<typeof settingsSchema>

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
