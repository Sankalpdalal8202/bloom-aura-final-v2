// ---------------------------------------------------------------------------
// GARLANDS DATA LAYER
// ---------------------------------------------------------------------------
// Single place that talks to the Supabase "garlands" / "garland_images"
// tables. Public pages use the read functions (with a static-data safety
// net); the admin panel uses the CRUD functions.
//
// Every function here returns/accepts the same object "shape" the UI has
// used since Phase 1 (see src/data/garlands.js) so GarlandCard, Home,
// Collection and Garland Details did not need to be redesigned — only
// switched from a static import to a fetch call.
// ---------------------------------------------------------------------------

import { supabase } from './supabase.js'
import staticGarlands from '../data/garlands.js'
import {
  getPublicImageUrl,
  sortImagesByOrder,
  PLACEHOLDER_IMAGE,
} from './garlandImages.js'

const SELECT_WITH_IMAGES = '*, garland_images(*)'

export const CATEGORY_OPTIONS = ['Wedding', 'Traditional', 'Luxury', 'Everyday']

// ---------------------------------------------------------------------------
// Mapping: Supabase row -> UI shape
// ---------------------------------------------------------------------------

function mapRowToGarland(row) {
  const images = sortImagesByOrder(row.garland_images || [])
  const imageUrls = images.length > 0 ? images.map((img) => getPublicImageUrl(img.storage_path)) : [PLACEHOLDER_IMAGE]

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    shortDescription: row.short_description || '',
    description: row.description || '',
    flowers: row.flowers || [],
    sizes: row.sizes || [],
    customization: row.customization_available,
    customizationNote: row.customization_note || '',
    delivery: row.delivery_information || '',
    images: imageUrls,
    featured: row.featured,
    published: row.published,
    updatedAt: row.updated_at,
  }
}

// ---------------------------------------------------------------------------
// PUBLIC READS (customer-facing pages)
// ---------------------------------------------------------------------------

/**
 * All published garlands, newest first. Falls back to the original static
 * sample data if Supabase has nothing published yet (or is unreachable),
 * so the public site never looks empty/broken while the owner is still
 * setting things up.
 */
export async function fetchPublishedGarlands() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const { data, error } = await supabase
      .from('garlands')
      .select(SELECT_WITH_IMAGES)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .abortSignal(controller.signal)

    clearTimeout(timeout)

    if (error) throw error
    if (!data || data.length === 0) return staticGarlands

    return data.map(mapRowToGarland)
  } catch (err) {
    console.warn('[garlands] Falling back to sample data:', err.message)
    return staticGarlands
  }
}

/** Featured-first subset of a garland list, e.g. for the homepage. */
export function pickFeatured(list, count = 3) {
  const featured = list.filter((g) => g.featured)
  const rest = list.filter((g) => !g.featured)
  return [...featured, ...rest].slice(0, count)
}

// ---------------------------------------------------------------------------
// ADMIN READS
// ---------------------------------------------------------------------------

/** Every garland (published + draft) — admin only, requires an authenticated session. */
export async function fetchAllGarlandsForAdmin() {
  const { data, error } = await supabase
    .from('garlands')
    .select(SELECT_WITH_IMAGES)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data || []).map((row) => ({
    ...mapRowToGarland(row),
    rawImages: sortImagesByOrder(row.garland_images || []),
  }))
}

/** A single garland by id, including raw (unmapped) image rows for the edit form. */
export async function fetchGarlandForAdmin(id) {
  const { data, error } = await supabase
    .from('garlands')
    .select(SELECT_WITH_IMAGES)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    ...mapRowToGarland(data),
    rawImages: sortImagesByOrder(data.garland_images || []),
  }
}

// ---------------------------------------------------------------------------
// ADMIN WRITES
// ---------------------------------------------------------------------------

export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
}

function toDbPayload(form) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    category: form.category,
    price: Number(form.price),
    short_description: form.shortDescription.trim(),
    description: form.description.trim(),
    flowers: form.flowers,
    sizes: form.sizes,
    customization_available: form.customizationAvailable,
    customization_note: form.customizationNote.trim(),
    delivery_information: form.deliveryInformation?.trim() || null,
    published: form.published,
  }
}

function friendlyDbError(error) {
  if (error?.code === '23505') {
    return 'A garland with this URL slug already exists. Please choose another slug.'
  }
  return 'Could not save this garland. Please check the information and try again.'
}

/** Create a new garland row. Returns the created row's id. */
export async function createGarland(form) {
  const { data, error } = await supabase
    .from('garlands')
    .insert(toDbPayload(form))
    .select('id')
    .single()

  if (error) throw new Error(friendlyDbError(error))
  return data.id
}

/** Update an existing garland's fields (not its images). */
export async function updateGarland(id, form) {
  const { error } = await supabase.from('garlands').update(toDbPayload(form)).eq('id', id)
  if (error) throw new Error(friendlyDbError(error))
}

/** Flip published/draft status only — used by the quick toggle in the list. */
export async function setGarlandPublished(id, published) {
  const { error } = await supabase.from('garlands').update({ published }).eq('id', id)
  if (error) throw new Error('Could not update publish status. Please try again.')
}

/** Delete the garland row. Caller is responsible for deleting its images first. */
export async function deleteGarlandRow(id) {
  const { error } = await supabase.from('garlands').delete().eq('id', id)
  if (error) throw new Error('Could not delete this garland. Please try again.')
}

// ---------------------------------------------------------------------------
// ADMIN — IMAGE ROWS (garland_images table)
// ---------------------------------------------------------------------------

export async function insertGarlandImageRow(garlandId, storagePath, displayOrder) {
  const { data, error } = await supabase
    .from('garland_images')
    .insert({ garland_id: garlandId, storage_path: storagePath, display_order: displayOrder })
    .select()
    .single()

  if (error) throw new Error('Could not save the uploaded photo. Please try again.')
  return data
}

export async function deleteGarlandImageRow(imageId) {
  const { error } = await supabase.from('garland_images').delete().eq('id', imageId)
  if (error) throw new Error('Could not remove this photo. Please try again.')
}

export async function updateGarlandImageOrder(imageId, displayOrder) {
  const { error } = await supabase
    .from('garland_images')
    .update({ display_order: displayOrder })
    .eq('id', imageId)

  if (error) throw new Error('Could not update the photo order. Please try again.')
}
