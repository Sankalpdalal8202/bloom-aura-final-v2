-- ===========================================================================
-- BLOOMAURA — PHASE 4A DATABASE SCHEMA (ORDERS / ENQUIRIES)
-- ===========================================================================
-- Run this entire file once in the Supabase SQL Editor (SQL Editor -> New
-- query -> paste this file -> Run). It is safe to run once and does not
-- touch the existing garlands / garland_images tables or data.
--
-- This creates:
--   1. orders               — one row per customer order/enquiry
--   2. A readable order_number generator (e.g. BA-20260820-0001)
--   3. An updated_at trigger (reusing the function from schema.sql)
--   4. Row Level Security so customers can submit orders but cannot read,
--      edit or delete anyone's orders — only an authenticated admin can.
-- ===========================================================================

-- Needed for gen_random_uuid() — already created by schema.sql, safe to repeat.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. ORDERS TABLE
-- ---------------------------------------------------------------------------
-- garland_name / garland_price are a SNAPSHOT taken at the moment the order
-- is placed. If the owner later renames the garland or changes its price,
-- old orders keep showing what the customer actually ordered — they do not
-- silently change. garland_id is kept for convenience (e.g. linking back to
-- the product) but is set to NULL if that garland is ever deleted, rather
-- than blocking the deletion or losing the order.
create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text unique, -- filled in automatically, see trigger below
  garland_id          uuid references public.garlands(id) on delete set null,
  garland_name        text not null,
  garland_price       numeric(10, 2) not null,
  size                text not null default 'Standard',
  quantity            integer not null default 1 check (quantity between 1 and 50),
  customization       text,
  required_date       date not null,
  customer_name       text not null,
  customer_phone      text not null,
  customer_whatsapp   text,
  delivery_location   text not null,
  customer_note       text,
  status              text not null default 'new'
                        check (status in ('new', 'contacted', 'confirmed', 'completed', 'cancelled')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- ---------------------------------------------------------------------------
-- 2. HUMAN-READABLE ORDER NUMBER
-- ---------------------------------------------------------------------------
-- Format: BA-YYYYMMDD-#### (e.g. BA-20260820-0001). The numeric suffix comes
-- from a single always-increasing sequence rather than resetting each day —
-- this keeps generation simple and completely free of race conditions, while
-- the date prefix still tells you at a glance when the order came in. The
-- important guarantee (this is what the UNIQUE constraint above enforces) is
-- that no two orders ever share a number.
create sequence if not exists public.orders_number_seq;

create or replace function public.generate_order_number()
returns trigger as $$
begin
  if new.order_number is null then
    new.order_number := 'BA-' || to_char(now(), 'YYYYMMDD') || '-' ||
                         lpad(nextval('public.orders_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists orders_set_order_number on public.orders;
create trigger orders_set_order_number
  before insert on public.orders
  for each row
  execute function public.generate_order_number();

-- Reuses the same set_updated_at() function created in schema.sql (Phase 2).
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table public.orders enable row level security;

-- Anyone (a customer browsing the public site, not logged in) can submit an
-- order. The "with check" clause only allows the row to be created with
-- status = 'new' — a customer's request can never insert itself as already
-- "confirmed" or "completed".
drop policy if exists "Anyone can submit an order" on public.orders;
create policy "Anyone can submit an order"
  on public.orders
  for insert
  to anon, authenticated
  with check (status = 'new');

-- Customers cannot read ANY orders — not their own, not anyone else's. There
-- is no customer login in this phase, so there is no reliable way to scope
-- "their own" orders; the safest behaviour is that only the authenticated
-- admin can ever read order data back out.
drop policy if exists "Authenticated admin can read all orders" on public.orders;
create policy "Authenticated admin can read all orders"
  on public.orders
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated admin can update orders" on public.orders;
create policy "Authenticated admin can update orders"
  on public.orders
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated admin can delete orders" on public.orders;
create policy "Authenticated admin can delete orders"
  on public.orders
  for delete
  to authenticated
  using (true);


-- ---------------------------------------------------------------------------
-- 4. PUBLIC ORDER SUBMISSION (SECURITY DEFINER RPC)
-- ---------------------------------------------------------------------------
-- The public order form calls this function instead of inserting directly.
-- It runs with the function owner's privileges (bypassing RLS for just this
-- one tightly-scoped insert), forces status to 'new' itself, and returns
-- only the confirmation fields the customer needs — the orders table is
-- never opened up to public SELECT. See order-submission-rpc-fix.sql for
-- the full explanation of why this exists.
create or replace function public.submit_order(
  p_garland_id uuid,
  p_garland_name text,
  p_garland_price numeric,
  p_size text,
  p_quantity integer,
  p_customization text,
  p_required_date date,
  p_customer_name text,
  p_customer_phone text,
  p_customer_whatsapp text,
  p_delivery_location text,
  p_customer_note text
)
returns table (
  order_number text,
  garland_name text,
  garland_price numeric,
  size text,
  quantity integer,
  customization text,
  required_date date,
  customer_name text,
  customer_phone text,
  customer_whatsapp text,
  delivery_location text,
  customer_note text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders;
begin
  -- Minimal server-side sanity checks. The table's own NOT NULL / CHECK
  -- constraints (quantity between 1 and 50, status enum, etc.) still apply
  -- to this insert regardless of SECURITY DEFINER — that only bypasses RLS,
  -- not column constraints — so we only need to guard what those don't
  -- already cover.
  if p_customer_name is null or length(trim(p_customer_name)) < 2 then
    raise exception 'A valid customer name is required.';
  end if;

  if p_customer_phone is null or length(trim(p_customer_phone)) < 6 then
    raise exception 'A valid phone number is required.';
  end if;

  if p_delivery_location is null or length(trim(p_delivery_location)) = 0 then
    raise exception 'A delivery location is required.';
  end if;

  if p_required_date is null or p_required_date < current_date then
    raise exception 'A valid, non-past required date is required.';
  end if;

  insert into public.orders (
    garland_id, garland_name, garland_price, size, quantity, customization,
    required_date, customer_name, customer_phone, customer_whatsapp,
    delivery_location, customer_note, status
  ) values (
    p_garland_id,
    p_garland_name,
    p_garland_price,
    coalesce(nullif(trim(p_size), ''), 'Standard'),
    p_quantity,
    p_customization,
    p_required_date,
    trim(p_customer_name),
    trim(p_customer_phone),
    nullif(trim(p_customer_whatsapp), ''),
    trim(p_delivery_location),
    nullif(trim(p_customer_note), ''),
    'new' -- status is ALWAYS forced here; the client cannot influence it
  )
  returning * into v_order;

  return query
    select
      v_order.order_number,
      v_order.garland_name,
      v_order.garland_price,
      v_order.size,
      v_order.quantity,
      v_order.customization,
      v_order.required_date,
      v_order.customer_name,
      v_order.customer_phone,
      v_order.customer_whatsapp,
      v_order.delivery_location,
      v_order.customer_note,
      v_order.status,
      v_order.created_at;
end;
$$;

-- Lock down execute privileges explicitly: only anon (public customers) and
-- authenticated (logged-in admin, harmless to allow) can call this function.
-- Nothing else changes — the orders table's SELECT/UPDATE/DELETE policies
-- remain authenticated-only exactly as before.
revoke all on function public.submit_order(
  uuid, text, numeric, text, integer, text, date, text, text, text, text, text
) from public;

grant execute on function public.submit_order(
  uuid, text, numeric, text, integer, text, date, text, text, text, text, text
) to anon, authenticated;

-- ===========================================================================
-- Done. The table starts empty. Submitting a test order from the public
-- website (Garland Details -> Order Now) is the best way to confirm this
-- worked — it should appear in Admin -> Orders immediately after.
-- ===========================================================================
