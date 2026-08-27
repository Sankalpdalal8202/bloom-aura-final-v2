-- ===========================================================================
-- BLOOMAURA — PHASE 2 DATABASE SCHEMA
-- ===========================================================================
-- Run this entire file once in the Supabase SQL Editor (see setup
-- instructions in the chat response for exactly where to paste it).
--
-- This creates:
--   1. garlands            — one row per garland product
--   2. garland_images      — one row per photo, linked to a garland
--   3. Row Level Security policies for both tables
--   4. Storage policies for the "garland-images" bucket
--
-- It intentionally does NOT create tables for orders or reviews yet —
-- those are out of scope for this phase and will be added later.
-- ===========================================================================

-- Needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. GARLANDS TABLE
-- ---------------------------------------------------------------------------
create table if not exists public.garlands (
  id                        uuid primary key default gen_random_uuid(),
  slug                      text not null unique,
  name                      text not null,
  category                  text not null,
  price                     numeric(10, 2) not null,
  short_description         text,
  description               text,
  flowers                   text[] not null default '{}',
  sizes                     text[] not null default '{}',
  customization_available   boolean not null default false,
  customization_note        text,
  delivery_information      text,
  featured                  boolean not null default false,
  published                 boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- Keep updated_at current automatically on every edit.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists garlands_set_updated_at on public.garlands;
create trigger garlands_set_updated_at
  before update on public.garlands
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. GARLAND IMAGES TABLE
-- ---------------------------------------------------------------------------
-- storage_path is the path of the file inside the "garland-images" Storage
-- bucket (e.g. "royal-rose/main.jpg"), not a full URL.
create table if not exists public.garland_images (
  id             uuid primary key default gen_random_uuid(),
  garland_id     uuid not null references public.garlands(id) on delete cascade,
  storage_path   text not null,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists garland_images_garland_id_idx
  on public.garland_images (garland_id);

-- ---------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY — GARLANDS
-- ---------------------------------------------------------------------------
alter table public.garlands enable row level security;

-- Anyone (including logged-out customers) can read published garlands.
drop policy if exists "Public can read published garlands" on public.garlands;
create policy "Public can read published garlands"
  on public.garlands
  for select
  using (published = true);

-- Any authenticated user can read ALL garlands, including unpublished
-- drafts. This is needed so the Admin Dashboard can show accurate
-- "Published" / "Drafts" counts. Right now this means "anyone who has a
-- Supabase login" (there is no public registration, so this is only the
-- owner). Once the Admin Panel supports multiple accounts, tighten this to
-- a specific admin role/user id instead of any authenticated user.
drop policy if exists "Authenticated users can read all garlands" on public.garlands;
create policy "Authenticated users can read all garlands"
  on public.garlands
  for select
  to authenticated
  using (true);

-- Any authenticated user can manage garlands.
-- NOTE: right now this means "anyone who has a Supabase login", because the
-- Admin Panel (Phase 3) does not exist yet. Once admin login is built, this
-- should be tightened to only the owner's account (e.g. by checking their
-- user id or an "is_admin" claim) rather than any authenticated user.
drop policy if exists "Authenticated users can insert garlands" on public.garlands;
create policy "Authenticated users can insert garlands"
  on public.garlands
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update garlands" on public.garlands;
create policy "Authenticated users can update garlands"
  on public.garlands
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can delete garlands" on public.garlands;
create policy "Authenticated users can delete garlands"
  on public.garlands
  for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY — GARLAND IMAGES
-- ---------------------------------------------------------------------------
alter table public.garland_images enable row level security;

-- Public can read images that belong to a published garland.
drop policy if exists "Public can read images of published garlands" on public.garland_images;
create policy "Public can read images of published garlands"
  on public.garland_images
  for select
  using (
    exists (
      select 1 from public.garlands g
      where g.id = garland_images.garland_id
        and g.published = true
    )
  );

-- Any authenticated user can read ALL garland images, including images of
-- unpublished/draft garlands. Needed so the Admin Garlands screen can show
-- a draft's photos while editing it.
drop policy if exists "Authenticated users can read all garland images" on public.garland_images;
create policy "Authenticated users can read all garland images"
  on public.garland_images
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can insert garland images" on public.garland_images;
create policy "Authenticated users can insert garland images"
  on public.garland_images
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update garland images" on public.garland_images;
create policy "Authenticated users can update garland images"
  on public.garland_images
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can delete garland images" on public.garland_images;
create policy "Authenticated users can delete garland images"
  on public.garland_images
  for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 5. STORAGE POLICIES — "garland-images" BUCKET
-- ---------------------------------------------------------------------------
-- These policies assume you have already created a PUBLIC bucket named
-- exactly "garland-images" in the Supabase dashboard (Storage section).
-- A public bucket lets the website display photos directly by URL, which is
-- what we want for product photography. Only writes are restricted.
drop policy if exists "Public can view garland images" on storage.objects;
create policy "Public can view garland images"
  on storage.objects
  for select
  using (bucket_id = 'garland-images');

drop policy if exists "Authenticated users can upload garland images" on storage.objects;
create policy "Authenticated users can upload garland images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'garland-images');

drop policy if exists "Authenticated users can update garland images" on storage.objects;
create policy "Authenticated users can update garland images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'garland-images')
  with check (bucket_id = 'garland-images');

drop policy if exists "Authenticated users can delete garland images" on storage.objects;
create policy "Authenticated users can delete garland images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'garland-images');

-- ===========================================================================
-- Done. The tables start empty — that's expected. The existing frontend
-- keeps using src/data/garlands.js as sample data until a later phase
-- connects the Collection/Details pages to these tables.
-- ===========================================================================
