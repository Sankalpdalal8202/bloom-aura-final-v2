import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CATEGORY_OPTIONS,
  createGarland,
  updateGarland,
  fetchGarlandForAdmin,
  slugify,
  insertGarlandImageRow,
  deleteGarlandImageRow,
  updateGarlandImageOrder,
} from '../../lib/garlands.js'
import { uploadGarlandImage, deleteGarlandImageFile, getPublicImageUrl } from '../../lib/garlandImages.js'
import ImageUploader from '../../components/admin/ImageUploader.jsx'
import AdminBanner from '../../components/admin/AdminBanner.jsx'
import siteConfig from '../../config/site.js'

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

const EMPTY_FORM = {
  name: '',
  slug: '',
  category: '',
  price: '',
  shortDescription: '',
  description: '',
  flowers: [],
  sizes: [],
  customizationAvailable: false,
  customizationNote: '',
  deliveryInformation: '',
  published: false,
}

// Used to detect unsaved changes — a simple, reliable comparison rather than
// a full deep-diff library. Image order/identity is captured via the key
// sequence, which changes on add/remove/reorder.
function snapshotOf(form, images) {
  return JSON.stringify({ form, imageOrder: images.map((img) => img.key) })
}

function ChipInput({ label, placeholder, values, onChange, disabled }) {
  const [input, setInput] = useState('')

  function commit() {
    const value = input.trim()
    if (value && !values.includes(value)) {
      onChange([...values, value])
    }
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    }
  }

  return (
    <div className="admin-field">
      <span>{label}</span>
      <div className="chip-input">
        {values.map((v) => (
          <span className="chip" key={v}>
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              disabled={disabled}
              aria-label={`Remove ${v}`}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          placeholder={placeholder}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

export default function AdminGarlandForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [slugTouched, setSlugTouched] = useState(false)
  const [images, setImages] = useState([]) // { key, url, isNew, file?, id?, storage_path?, display_order? }
  const [originalImages, setOriginalImages] = useState([]) // snapshot of existing images at load time

  const [loading, setLoading] = useState(isEditing)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveStage, setSaveStage] = useState('') // e.g. 'Saving details…', 'Uploading photos…'
  const [saveError, setSaveError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [initialSnapshot, setInitialSnapshot] = useState(null) // for unsaved-changes detection

  useEffect(() => {
    document.title = `${isEditing ? 'Edit' : 'Add'} Garland | ${siteConfig.businessName} Admin`
  }, [isEditing])

  // Baseline snapshot for a brand-new garland (edit mode sets its own after loading).
  useEffect(() => {
    if (!isEditing) {
      setInitialSnapshot(snapshotOf(EMPTY_FORM, []))
    }
  }, [isEditing])

  useEffect(() => {
    if (!isEditing) return
    let isMounted = true

    fetchGarlandForAdmin(id)
      .then((garland) => {
        if (!isMounted) return
        if (!garland) {
          setLoadError('This garland could not be found. It may have already been deleted.')
          return
        }
        setForm({
          name: garland.name,
          slug: garland.slug,
          category: garland.category,
          price: String(garland.price),
          shortDescription: garland.shortDescription,
          description: garland.description,
          flowers: garland.flowers,
          sizes: garland.sizes,
          customizationAvailable: garland.customization,
          customizationNote: garland.customizationNote,
          deliveryInformation: garland.delivery,
          published: garland.published,
        })
        setSlugTouched(true) // never auto-rewrite the slug of an existing garland
        const existingImages = garland.rawImages.map((img) => ({
          key: img.id,
          url: getPublicImageUrl(img.storage_path),
          id: img.id,
          storage_path: img.storage_path,
          display_order: img.display_order,
        }))
        setImages(existingImages)
        setOriginalImages(existingImages)
        setInitialSnapshot(
          snapshotOf(
            {
              name: garland.name,
              slug: garland.slug,
              category: garland.category,
              price: String(garland.price),
              shortDescription: garland.shortDescription,
              description: garland.description,
              flowers: garland.flowers,
              sizes: garland.sizes,
              customizationAvailable: garland.customization,
              customizationNote: garland.customizationNote,
              deliveryInformation: garland.delivery,
              published: garland.published,
            },
            existingImages
          )
        )
      })
      .catch(() => setLoadError('Could not load this garland. Please try again.'))
      .finally(() => setLoading(false))

    return () => {
      isMounted = false
    }
  }, [id, isEditing])

  function updateField(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'name' && !slugTouched) {
        next.slug = slugify(value)
      }
      return next
    })
  }

  const isDirty = initialSnapshot !== null && snapshotOf(form, images) !== initialSnapshot

  // Warn on tab close/refresh if there are unsaved changes. Deliberately not
  // intercepting in-app route navigation (e.g. sidebar links) — that kind of
  // router-level blocking gets fragile fast; the Cancel button below covers
  // the one in-app exit path this form has.
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (!isDirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  function handleCancel() {
    if (isDirty && !window.confirm('You have unsaved changes. Discard them and leave this page?')) {
      return
    }
    navigate('/admin/garlands')
  }

  function validate() {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Garland name is required.'
    if (!form.category) errors.category = 'Please select a category.'
    if (form.price === '' || Number.isNaN(Number(form.price)) || Number(form.price) <= 0) {
      errors.price = 'Price must be greater than \u20b90.'
    }
    if (!form.shortDescription.trim()) errors.shortDescription = 'Short description is required.'
    if (!form.description.trim()) errors.description = 'Description is required.'

    const slugCandidate = (form.slug.trim() || slugify(form.name)).trim()
    if (!slugCandidate) {
      errors.slug = 'Slug is required.'
    } else if (!SLUG_PATTERN.test(slugCandidate)) {
      errors.slug = 'Slug can only contain lowercase letters, numbers and hyphens.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSetPrimary(key) {
    setImages((prev) => {
      const chosen = prev.find((img) => img.key === key)
      if (!chosen) return prev
      return [chosen, ...prev.filter((img) => img.key !== key)]
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaveError('')
    if (!validate()) return

    setSaving(true)
    setSaveStage('Saving garland details\u2026')
    try {
      const payload = { ...form, slug: form.slug.trim() || slugify(form.name) }

      const garlandId = isEditing ? id : await createGarland(payload)
      if (isEditing) {
        await updateGarland(id, payload)
      }

      // Remove images the admin took out during this edit.
      const removed = originalImages.filter((orig) => !images.some((cur) => cur.key === orig.key))
      if (removed.length > 0) {
        setSaveStage('Removing deleted photos\u2026')
      }
      for (const img of removed) {
        try {
          await deleteGarlandImageFile(img.storage_path)
        } catch (err) {
          // File may already be gone — continue so the DB row is still cleaned up.
          console.error('Could not delete storage file for image', img.id, err)
        }
        try {
          await deleteGarlandImageRow(img.id)
        } catch (err) {
          // Best effort — don't block the rest of the save on one failed cleanup.
          console.error('Could not delete garland_images row', img.id, err)
        }
      }

      // Upload new images / persist ordering (primary = index 0).
      const hasNewImages = images.some((img) => img.isNew)
      if (hasNewImages) setSaveStage('Uploading photos\u2026')
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        if (img.isNew) {
          const storagePath = await uploadGarlandImage(garlandId, img.file)
          await insertGarlandImageRow(garlandId, storagePath, i)
        } else if (img.display_order !== i) {
          await updateGarlandImageOrder(img.id, i)
        }
      }

      navigate('/admin/garlands', {
        state: { success: isEditing ? 'Garland updated successfully.' : 'Garland created successfully.' },
      })
    } catch (err) {
      console.error('Garland save failed:', err)
      setSaveError(err.message || 'Could not save this garland. Please check the information and try again.')
    } finally {
      setSaving(false)
      setSaveStage('')
    }
  }

  if (loading) {
    return <p className="empty-state">Loading garland…</p>
  }

  if (loadError) {
    return <AdminBanner type="error">{loadError}</AdminBanner>
  }

  return (
    <div className="admin-garland-form">
      <div className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">{siteConfig.businessName} Admin</p>
          <h1>{isEditing ? 'Edit Garland' : 'Add Garland'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>Garland Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              disabled={saving}
            />
            {fieldErrors.name && <p className="admin-field__error">{fieldErrors.name}</p>}
          </label>

          <label className="admin-field">
            <span>Slug</span>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true)
                setForm((prev) => ({ ...prev, slug: e.target.value }))
              }}
              disabled={saving}
            />
            {fieldErrors.slug && <p className="admin-field__error">{fieldErrors.slug}</p>}
          </label>

          <label className="admin-field">
            <span>Category</span>
            <select
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              disabled={saving}
            >
              <option value="">Select a category&hellip;</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {fieldErrors.category && <p className="admin-field__error">{fieldErrors.category}</p>}
          </label>

          <label className="admin-field">
            <span>Price (&#8377;)</span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.price}
              onChange={(e) => updateField('price', e.target.value)}
              disabled={saving}
            />
            {fieldErrors.price && <p className="admin-field__error">{fieldErrors.price}</p>}
          </label>

          <label className="admin-field admin-field--full">
            <span>Short Description</span>
            <input
              type="text"
              value={form.shortDescription}
              onChange={(e) => updateField('shortDescription', e.target.value)}
              disabled={saving}
              placeholder="Shown on the collection card"
            />
            {fieldErrors.shortDescription && (
              <p className="admin-field__error">{fieldErrors.shortDescription}</p>
            )}
          </label>

          <label className="admin-field admin-field--full">
            <span>Full Description</span>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              disabled={saving}
            />
            {fieldErrors.description && <p className="admin-field__error">{fieldErrors.description}</p>}
          </label>

          <ChipInput
            label="Flowers"
            placeholder="Type a flower and press Enter"
            values={form.flowers}
            onChange={(v) => updateField('flowers', v)}
            disabled={saving}
          />

          <ChipInput
            label="Available Sizes"
            placeholder="Type a size and press Enter"
            values={form.sizes}
            onChange={(v) => updateField('sizes', v)}
            disabled={saving}
          />

          <label className="admin-field admin-checkbox-field">
            <input
              type="checkbox"
              checked={form.customizationAvailable}
              onChange={(e) => updateField('customizationAvailable', e.target.checked)}
              disabled={saving}
            />
            <span>Customization available</span>
          </label>

          <label className="admin-field admin-field--full">
            <span>Customization Note</span>
            <input
              type="text"
              value={form.customizationNote}
              onChange={(e) => updateField('customizationNote', e.target.value)}
              disabled={saving}
              placeholder="Optional"
            />
          </label>

          <label className="admin-field admin-field--full">
            <span>Delivery Information</span>
            <input
              type="text"
              value={form.deliveryInformation}
              onChange={(e) => updateField('deliveryInformation', e.target.value)}
              disabled={saving}
              placeholder="Optional"
            />
          </label>

          <label className="admin-field admin-checkbox-field">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => updateField('published', e.target.checked)}
              disabled={saving}
            />
            <span>Published (visible on the public website)</span>
          </label>
        </div>

        <div className="admin-field admin-field--full">
          <span>Photos</span>
          <ImageUploader
            images={images}
            onChange={setImages}
            onSetPrimary={handleSetPrimary}
            disabled={saving}
          />
        </div>

        {saveError && <AdminBanner type="error">{saveError}</AdminBanner>}

        <div className="admin-form-actions">
          <button type="button" className="btn btn--outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn--gold" disabled={saving}>
            {saving ? saveStage || 'Saving\u2026' : 'Save Garland'}
          </button>
        </div>
      </form>
    </div>
  )
}
