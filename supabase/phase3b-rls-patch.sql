-- ===========================================================================
-- PHASE 3B — RLS PATCH
-- ===========================================================================
-- Run this once in the Supabase SQL Editor. It only ADDS one new policy —
-- it does not touch your existing data, tables, or other policies.
--
-- Why: the Admin Garlands screen needs to load the photos for a DRAFT
-- garland when you open it to edit. The existing policy only let logged-in
-- users read images belonging to PUBLISHED garlands (same rule as the
-- public website), so a draft's photos were invisible in the admin panel.
-- This adds a policy so any authenticated user (currently just the owner,
-- since there is no public sign-up) can read all garland photos, published
-- or not.
--
-- Everything else from Phase 2/3A — public read access, insert/update/
-- delete permissions, storage policies — is unchanged and already covers
-- what Phase 3B (garland management) needs.
-- ===========================================================================

drop policy if exists "Authenticated users can read all garland images" on public.garland_images;
create policy "Authenticated users can read all garland images"
  on public.garland_images
  for select
  to authenticated
  using (true);
