-- ===========================================================================
-- ORDER SUBMISSION RPC — PRODUCTION BUG FIX
-- ===========================================================================
-- Run this once in the Supabase SQL Editor. Safe to run on an existing
-- project — it only ADDS a function; it does not touch the orders table,
-- its data, or any existing RLS policy.
--
-- ROOT CAUSE
-- ----------
-- The public order form used:
--     supabase.from('orders').insert(payload).select().single()
-- `.select()` makes PostgREST also SELECT the row back after inserting
-- (Prefer: return=representation), and that SELECT runs under the CALLING
-- role's own RLS — not a special "just inserted this" bypass. Since the
-- orders SELECT policy is `to authenticated` only, a genuinely anonymous
-- customer's INSERT succeeded (the order really was saved) but the
-- follow-up SELECT returned zero rows, so `.single()` threw an error and
-- the customer saw "Could not submit your order request." even though
-- their order existed in the database. Any browser with a lingering
-- authenticated admin session (e.g. from earlier testing) would appear to
-- "work fine", masking the bug on some devices but not others.
--
-- FIX
-- ---
-- Public order creation now goes through this SECURITY DEFINER function
-- instead of a direct table insert+select. It:
--   - runs the INSERT with the function owner's privileges, bypassing RLS
--     for that one, tightly-scoped operation (not a general bypass)
--   - forces status to 'new' itself — the client cannot pass a status
--   - returns ONLY the fields the confirmation screen needs
--   - never exposes the orders table to anon SELECT
-- The existing SELECT/UPDATE/DELETE policies (authenticated/admin only)
-- are completely unchanged.
-- ===========================================================================

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
-- Done. No changes to RLS policies, no public SELECT on orders. Anonymous
-- customers can now call submit_order(...) and reliably get back their own
-- new order's confirmation details — nothing else in the table is exposed.
-- ===========================================================================
