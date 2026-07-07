-- ============================================================
-- Migration 003 — Fixes:
-- 1. Revenue should count actual cash collected (amount_paid),
--    not just fully "paid"/"delivered" invoices — partial
--    payments on pending_payment invoices were being ignored.
-- 2. Revenue views blended all currencies into one number.
--    Split every revenue view by currency — you cannot sum
--    PKR + USD + AED into a single meaningful total without
--    an exchange rate feed, which this system does not have.
-- ============================================================

-- ---------- Revenue summary, grouped by currency ----------

drop view if exists v_revenue_summary;

create view v_revenue_summary_by_currency as
select
  currency,
  coalesce(sum(amount_paid) filter (where status <> 'cancelled'), 0) as total_revenue,
  coalesce(sum(balance_due) filter (where status in ('approved', 'pending_payment')), 0) as pending_revenue,
  coalesce(sum(amount_paid) filter (where status <> 'cancelled'), 0) as paid_revenue,
  coalesce(sum(balance_due) filter (where status not in ('draft', 'cancelled')), 0) as outstanding_revenue,
  coalesce(sum(amount_paid) filter (
    where status <> 'cancelled'
    and date_trunc('month', invoice_date) = date_trunc('month', current_date)
  ), 0) as this_month_revenue,
  coalesce(sum(amount_paid) filter (
    where status <> 'cancelled'
    and date_trunc('year', invoice_date) = date_trunc('year', current_date)
  ), 0) as this_year_revenue
from invoices
group by currency;

-- ---------- Monthly revenue, grouped by currency, 12 months zero-filled ----------

drop view if exists v_monthly_revenue;

create view v_monthly_revenue as
select
  month_series::date as month,
  cur.currency,
  coalesce(sum(i.amount_paid) filter (where i.status <> 'cancelled'), 0) as revenue
from generate_series(
  date_trunc('year', current_date),
  date_trunc('year', current_date) + interval '11 months',
  interval '1 month'
) as month_series
cross join (select distinct currency from invoices) as cur
left join invoices i
  on date_trunc('month', i.invoice_date) = month_series
  and i.currency = cur.currency
  and i.status <> 'cancelled'
group by month_series, cur.currency
order by month_series, cur.currency;

-- ---------- Revenue by client, grouped by currency ----------

drop view if exists v_revenue_by_client;

create view v_revenue_by_client as
select
  c.id as client_id,
  c.name as client_name,
  i.currency,
  coalesce(sum(i.amount_paid) filter (where i.status <> 'cancelled'), 0) as paid_revenue,
  coalesce(sum(i.balance_due) filter (where i.status not in ('draft', 'cancelled')), 0) as outstanding
from clients c
left join invoices i on i.client_id = c.id
group by c.id, c.name, i.currency;
