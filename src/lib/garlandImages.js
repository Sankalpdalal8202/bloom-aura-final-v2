// ---------------------------------------------------------------------------
// GARLAND IMAGE STORAGE HELPERS
// ---------------------------------------------------------------------------
// All Supabase Storage logic for garland photos lives here, so no other
// component talks to the "garland-images" bucket directly.
// ---------------------------------------------------------------------------

import { supabase } from './supabase.js'

const BUCKET = 'garland-images'

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
export const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024 // 8MB

// Local fallback shown wherever a garland has no uploaded photos yet.
export const PLACEHOLDER_IMAGE = '/images/placeholder-garland.svg'

function extensionFor(file) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

function randomId() {
  return (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)
}

export function validateImageFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Please upload a JPG, PNG, or WEBP image.'
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Image must be smaller than 8 MB.'
  }
  return null
}

/**
 * Upload a single image file for a garland.
 * @returns {Promise<string>} the storage_path to save in garland_images
 */
export async function uploadGarlandImage(garlandId, file) {
  const path = `${garlandId}/${randomId()}.${extensionFor(file)}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  return path
}

/** Delete a single image file from storage (does not touch the database row). */
export async function deleteGarlandImageFile(storagePath) {
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath])
  if (error) throw error
}

/** Delete every file inside a garland's storage folder (used when deleting a garland). */
export async function deleteAllGarlandImageFiles(garlandId) {
  const { data: files, error: listError } = await supabase.storage.from(BUCKET).list(garlandId)
  if (listError) throw listError
  if (!files || files.length === 0) return
  const paths = files.map((f) => `${garlandId}/${f.name}`)
  const { error } = await supabase.storage.from(BUCKET).remove(paths)
  if (error) throw error
}

/** Turn a stored path into a public, browser-loadable URL. */
export function getPublicImageUrl(storagePath) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

/**
 * Images don't have an explicit "is primary" column — the image with the
 * lowest display_order is treated as primary. This keeps the schema simple
 * and avoids an extra migration.
 */
export function sortImagesByOrder(images) {
  return [...(images || [])].sort((a, b) => a.display_order - b.display_order)
}

export function getPrimaryImage(images) {
  const sorted = sortImagesByOrder(images)
  return sorted[0] ?? null
}

/**
 * Given the current image list (already sorted) and the id of the image to
 * make primary, return a new array with display_order values reassigned so
 * that image sits first, and everything else keeps its relative order.
 */
export function reorderWithPrimary(images, primaryId) {
  const sorted = sortImagesByOrder(images)
  const chosen = sorted.find((img) => img.id === primaryId)
  if (!chosen) return sorted
  const rest = sorted.filter((img) => img.id !== primaryId)
  return [chosen, ...rest].map((img, index) => ({ ...img, display_order: index }))
}
