-- ============================================================
-- Migration 004 — Fix revenue formula bug.
--
-- Previous version (migration 003) computed "Total Revenue" and
-- "Paid Revenue" identically (both summed amount_paid). That's
-- why the dashboard showed Total = Paid = 33,500 instead of the
-- correct Total = 49,000 (full invoiced value).
--
-- Correct model:
--   Total Revenue   = full value of all committed invoices
--   Paid Revenue     = actual cash collected so far
--   Pending Revenue  = what's left to collect (Total - Paid)
-- "Committed" = any invoice past Draft and not Cancelled.
-- ============================================================

drop view if exists v_revenue_summary_by_currency;

create view v_revenue_summary_by_currency as
select
  currency,
  coalesce(sum(grand_total) filter (where status not in ('draft', 'cancelled')), 0) as total_revenue,
  coalesce(sum(balance_due) filter (where status not in ('draft', 'cancelled')), 0) as pending_revenue,
  coalesce(sum(amount_paid) filter (where status not in ('draft', 'cancelled')), 0) as paid_revenue,
  coalesce(sum(balance_due) filter (where status not in ('draft', 'cancelled')), 0) as outstanding_revenue,
  coalesce(sum(amount_paid) filter (
    where status not in ('draft', 'cancelled')
    and date_trunc('month', invoice_date) = date_trunc('month', current_date)
  ), 0) as this_month_revenue,
  coalesce(sum(amount_paid) filter (
    where status not in ('draft', 'cancelled')
    and date_trunc('year', invoice_date) = date_trunc('year', current_date)
  ), 0) as this_year_revenue
from invoices
group by currency;
