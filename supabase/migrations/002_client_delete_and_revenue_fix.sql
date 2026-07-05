-- ============================================================
-- Migration 002 — Fixes:
-- 1. Client delete blocked by FK constraint (invoices.client_id_fkey)
-- 2. Monthly Revenue chart only shows months with data (should show
--    all 12 months of the current year, zero-filled)
-- ============================================================

-- ---------- Fix 1: Allow client deletion, preserve invoice history ----------

-- Snapshot the client name onto the invoice at creation time, so invoice
-- history still shows "who it was" even after the client record is gone.
alter table invoices add column if not exists client_name_snapshot text;

update invoices i
set client_name_snapshot = c.name
from clients c
where c.id = i.client_id and i.client_name_snapshot is null;

-- Drop the RESTRICT constraint, make client_id nullable, re-add as SET NULL
alter table invoices drop constraint if exists invoices_client_id_fkey;
alter table invoices alter column client_id drop not null;
alter table invoices add constraint invoices_client_id_fkey
  foreign key (client_id) references clients(id) on delete set null;

-- Auto-snapshot the name on every future insert
create or replace function snapshot_client_name()
returns trigger language plpgsql as $$
begin
  if new.client_id is not null then
    select name into new.client_name_snapshot from clients where id = new.client_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_snapshot_client_name on invoices;
create trigger trg_snapshot_client_name
  before insert on invoices
  for each row execute function snapshot_client_name();

-- ---------- Fix 2: Monthly Revenue view — always return 12 months ----------

drop view if exists v_monthly_revenue;

create view v_monthly_revenue as
select
  month_series::date as month,
  coalesce(sum(i.grand_total), 0) as revenue
from generate_series(
  date_trunc('year', current_date),
  date_trunc('year', current_date) + interval '11 months',
  interval '1 month'
) as month_series
left join invoices i
  on date_trunc('month', i.invoice_date) = month_series
  and i.status in ('paid', 'delivered')
group by month_series
order by month_series;
