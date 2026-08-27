-- ===========================================================================
-- PHASE 3A — RLS PATCH
-- ===========================================================================
-- Run this once in the Supabase SQL Editor. It only ADDS one new policy —
-- it does not touch your existing data or existing policies.
--
-- Why: the Admin Dashboard needs to show a "Drafts" count, but the original
-- policy only let logged-in users read published garlands (same as the
-- public website). This policy lets any authenticated user (currently just
-- the owner, since there's no public sign-up) read unpublished drafts too.
--
-- This is already included in the main supabase/schema.sql for anyone
-- setting the project up fresh — you only need to run this file if you
-- already ran schema.sql before Phase 3A.
-- ===========================================================================

drop policy if exists "Authenticated users can read all garlands" on public.garlands;
create policy "Authenticated users can read all garlands"
  on public.garlands
  for select
  to authenticated
  using (true);
