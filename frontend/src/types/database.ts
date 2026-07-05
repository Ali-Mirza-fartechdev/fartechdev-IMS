export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'pending_approval'
  | 'approved'
  | 'pending_payment'
  | 'paid'
  | 'delivered'
  | 'cancelled'

export type PaymentMethod =
  | 'bank_transfer'
  | 'cash'
  | 'payoneer'
  | 'wise'
  | 'stripe'
  | 'paypal'
  | 'other'

export interface Client {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  country: string | null
  address: string | null
  tax_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  client_id: string | null
  client_name_snapshot: string | null
  invoice_date: string
  due_date: string
  currency: string
  subtotal: number
  discount: number
  tax: number
  grand_total: number
  amount_paid: number
  balance_due: number
  status: InvoiceStatus
  notes: string | null
  created_at: string
  updated_at: string
  client?: Client
  items?: InvoiceItem[]
  payments?: Payment[]
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  service_name: string
  description: string | null
  quantity: number
  unit_price: number
  line_total: number
  sort_order: number
  created_at: string
}

export interface Payment {
  id: string
  invoice_id: string
  payment_date: string
  payment_method: PaymentMethod
  reference_number: string | null
  amount: number
  notes: string | null
  created_at: string
}

export interface Settings {
  id: number
  company_name: string
  logo_url: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  bank_details: string | null
  default_currency: string
  tax_percentage: number
  invoice_prefix: string
  finance_head_name: string
  signature_url: string | null
  updated_at: string
}

export interface RevenueSummary {
  total_revenue: number
  pending_revenue: number
  paid_revenue: number
  outstanding_revenue: number
  this_month_revenue: number
  this_year_revenue: number
}

export interface MonthlyRevenue {
  month: string
  revenue: number
}

export interface RevenueByClient {
  client_id: string
  client_name: string
  paid_revenue: number
  outstanding: number
}

// Supabase generated-style Database interface
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>
      }
      invoices: {
        Row: Invoice
        Insert: Omit<
          Invoice,
          'id' | 'invoice_number' | 'balance_due' | 'created_at' | 'updated_at' | 'client' | 'items' | 'payments'
        > & { invoice_number?: string }
        Update: Partial<
          Omit<Invoice, 'id' | 'balance_due' | 'created_at' | 'updated_at' | 'client' | 'items' | 'payments'>
        >
      }
      invoice_items: {
        Row: InvoiceItem
        Insert: Omit<InvoiceItem, 'id' | 'line_total' | 'created_at'>
        Update: Partial<Omit<InvoiceItem, 'id' | 'line_total' | 'created_at'>>
      }
      payments: {
        Row: Payment
        Insert: Omit<Payment, 'id' | 'created_at'>
        Update: Partial<Omit<Payment, 'id' | 'created_at'>>
      }
      settings: {
        Row: Settings
        Insert: Partial<Settings>
        Update: Partial<Settings>
      }
    }
    Views: {
      v_revenue_summary: { Row: RevenueSummary }
      v_monthly_revenue: { Row: MonthlyRevenue }
      v_revenue_by_client: { Row: RevenueByClient }
    }
  }
}
