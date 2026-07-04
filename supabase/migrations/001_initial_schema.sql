-- ============================================================
-- FAR Tech & Developers — Invoice & Revenue Management System
-- Supabase PostgreSQL Schema — Migration 001
-- Single-admin system (Finance Head). No multi-tenant logic.
-- ============================================================

-- ---------- Extensions ----------
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ---------- Enums ----------
create type invoice_status as enum (
  'draft', 'sent', 'pending_approval', 'approved',
  'pending_payment', 'paid', 'delivered', 'cancelled'
);

create type payment_method as enum (
  'bank_transfer', 'cash', 'payoneer', 'wise', 'stripe', 'paypal', 'other'
);

-- ---------- Clients ----------
create table clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  company text,
  email text,
  phone text,
  whatsapp text,
  country text,
  address text,
  tax_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_clients_name on clients (lower(name));
create index idx_clients_company on clients (lower(company));
create index idx_clients_email on clients (lower(email));

-- ---------- Settings (single row) ----------
create table settings (
  id int primary key default 1,
  company_name text not null default 'FAR Tech & Developers',
  logo_url text,
  email text,
  phone text,
  website text,
  address text,
  bank_details text,
  default_currency text not null default 'USD',
  tax_percentage numeric(5,2) not null default 0,
  invoice_prefix text not null default 'FAR',
  finance_head_name text not null default 'Ahsan Mirza',
  signature_url text,
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);

insert into settings (id) values (1);

-- ---------- Invoices ----------
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text not null unique,
  client_id uuid not null references clients(id) on delete restrict,
  invoice_date date not null default current_date,
  due_date date not null,
  currency text not null default 'USD',
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  balance_due numeric(12,2) generated always as (grand_total - amount_paid) stored,
  status invoice_status not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint due_after_invoice check (due_date >= invoice_date)
);

create index idx_invoices_client on invoices (client_id);
create index idx_invoices_status on invoices (status);
create index idx_invoices_number on invoices (invoice_number);
create index idx_invoices_date on invoices (invoice_date);

-- ---------- Invoice Items ----------
create table invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  service_name text not null,
  description text,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  line_total numeric(12,2) generated always as (quantity * unit_price) stored,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_invoice_items_invoice on invoice_items (invoice_id);

-- ---------- Payments ----------
create table payments (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  payment_date date not null default current_date,
  payment_method payment_method not null default 'bank_transfer',
  reference_number text,
  amount numeric(12,2) not null check (amount > 0),
  notes text,
  created_at timestamptz not null default now()
);

create index idx_payments_invoice on payments (invoice_id);
create index idx_payments_date on payments (payment_date);

-- ============================================================
-- Triggers & Functions
-- ============================================================

-- updated_at auto-touch
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_clients_updated_at before update on clients
  for each row execute function set_updated_at();

create trigger trg_invoices_updated_at before update on invoices
  for each row execute function set_updated_at();

-- Recalculate invoice subtotal/tax/grand_total whenever items change
create or replace function recalc_invoice_totals()
returns trigger language plpgsql as $$
declare
  v_invoice_id uuid;
  v_subtotal numeric(12,2);
  v_tax_pct numeric(5,2);
begin
  v_invoice_id := coalesce(new.invoice_id, old.invoice_id);

  select coalesce(sum(line_total), 0) into v_subtotal
  from invoice_items where invoice_id = v_invoice_id;

  select tax_percentage into v_tax_pct from settings where id = 1;

  update invoices
  set subtotal = v_subtotal,
      tax = round(v_subtotal * coalesce(v_tax_pct, 0) / 100, 2),
      grand_total = v_subtotal + round(v_subtotal * coalesce(v_tax_pct, 0) / 100, 2) - discount
  where id = v_invoice_id;

  return null;
end;
$$;

create trigger trg_items_recalc
  after insert or update or delete on invoice_items
  for each row execute function recalc_invoice_totals();

-- Recalculate amount_paid + auto status transition whenever payments change
create or replace function recalc_invoice_payment_status()
returns trigger language plpgsql as $$
declare
  v_invoice_id uuid;
  v_paid numeric(12,2);
  v_grand_total numeric(12,2);
  v_current_status invoice_status;
begin
  v_invoice_id := coalesce(new.invoice_id, old.invoice_id);

  select coalesce(sum(amount), 0) into v_paid
  from payments where invoice_id = v_invoice_id;

  select grand_total, status into v_grand_total, v_current_status
  from invoices where id = v_invoice_id;

  if v_paid > v_grand_total then
    raise exception 'Total payments (%) cannot exceed invoice grand total (%)', v_paid, v_grand_total;
  end if;

  update invoices
  set amount_paid = v_paid,
      status = case
        when v_paid >= grand_total and grand_total > 0 then 'paid'::invoice_status
        when v_current_status in ('approved', 'pending_payment') then 'pending_payment'::invoice_status
        else v_current_status
      end
  where id = v_invoice_id;

  return null;
end;
$$;

create trigger trg_payments_recalc
  after insert or update or delete on payments
  for each row execute function recalc_invoice_payment_status();

-- Prevent editing Delivered invoices (business rule: Delivered = read-only)
create or replace function block_delivered_edits()
returns trigger language plpgsql as $$
begin
  if old.status = 'delivered' and new.status = 'delivered' then
    raise exception 'Delivered invoices are read-only and cannot be edited';
  end if;
  return new;
end;
$$;

create trigger trg_block_delivered_edits
  before update on invoices
  for each row execute function block_delivered_edits();

-- Only Draft invoices can be deleted
create or replace function block_non_draft_delete()
returns trigger language plpgsql as $$
begin
  if old.status <> 'draft' then
    raise exception 'Only Draft invoices can be deleted (current status: %)', old.status;
  end if;
  return old;
end;
$$;

create trigger trg_block_non_draft_delete
  before delete on invoices
  for each row execute function block_non_draft_delete();

-- Auto-generate invoice_number: PREFIX-YEAR-SEQUENCE
create sequence if not exists invoice_number_seq;

create or replace function generate_invoice_number()
returns trigger language plpgsql as $$
declare
  v_prefix text;
  v_year text;
  v_seq int;
begin
  if new.invoice_number is not null then
    return new;
  end if;

  select invoice_prefix into v_prefix from settings where id = 1;
  v_year := to_char(current_date, 'YYYY');

  select coalesce(max(
    cast(split_part(invoice_number, '-', 3) as int)
  ), 0) + 1
  into v_seq
  from invoices
  where invoice_number like v_prefix || '-' || v_year || '-%';

  new.invoice_number := v_prefix || '-' || v_year || '-' || lpad(v_seq::text, 4, '0');
  return new;
end;
$$;

create trigger trg_generate_invoice_number
  before insert on invoices
  for each row execute function generate_invoice_number();

-- ============================================================
-- Row Level Security (single-admin: authenticated = full access)
-- ============================================================

alter table clients enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table payments enable row level security;
alter table settings enable row level security;

create policy "admin_full_access_clients" on clients
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_full_access_invoices" on invoices
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_full_access_invoice_items" on invoice_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_full_access_payments" on payments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin_full_access_settings" on settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- Reporting views (used by Dashboard + Reports module)
-- ============================================================

create view v_revenue_summary as
select
  coalesce(sum(grand_total) filter (where status = 'paid' or status = 'delivered'), 0) as total_revenue,
  coalesce(sum(balance_due) filter (where status in ('pending_payment','approved')), 0) as pending_revenue,
  coalesce(sum(grand_total) filter (where status = 'paid' or status = 'delivered'), 0) as paid_revenue,
  coalesce(sum(balance_due) filter (where status not in ('draft','cancelled')), 0) as outstanding_revenue,
  coalesce(sum(grand_total) filter (
    where (status = 'paid' or status = 'delivered')
    and date_trunc('month', invoice_date) = date_trunc('month', current_date)
  ), 0) as this_month_revenue,
  coalesce(sum(grand_total) filter (
    where (status = 'paid' or status = 'delivered')
    and date_trunc('year', invoice_date) = date_trunc('year', current_date)
  ), 0) as this_year_revenue
from invoices
where status <> 'cancelled';

create view v_monthly_revenue as
select
  date_trunc('month', invoice_date)::date as month,
  sum(grand_total) as revenue
from invoices
where status in ('paid', 'delivered')
group by 1
order by 1;

create view v_revenue_by_client as
select
  c.id as client_id,
  c.name as client_name,
  sum(i.grand_total) filter (where i.status in ('paid','delivered')) as paid_revenue,
  sum(i.balance_due) filter (where i.status not in ('draft','cancelled')) as outstanding
from clients c
left join invoices i on i.client_id = c.id
group by c.id, c.name;

-- ============================================================
-- Storage buckets (logo + signature)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

create policy "branding_public_read" on storage.objects
  for select using (bucket_id = 'branding');

create policy "branding_admin_write" on storage.objects
  for insert with check (bucket_id = 'branding' and auth.role() = 'authenticated');

create policy "branding_admin_update" on storage.objects
  for update using (bucket_id = 'branding' and auth.role() = 'authenticated');
