import { useRef, useState } from 'react'
import { validateImageFile } from '../../lib/garlandImages.js'

/**
 * Controlled image list editor.
 *
 * `images` is an array of: { key, url, isNew, file?, id?, storage_path? }
 * - existing (already-saved) images have `id` and `storage_path`
 * - newly-added-but-not-yet-uploaded images have `isNew: true` and `file`
 *
 * Order in the array IS the display order — the first item is always the
 * primary photo. The parent owns the array and passes down onChange; this
 * component never talks to Supabase directly, it only edits the local list.
 */
export default function ImageUploader({ images, onChange, onSetPrimary, disabled }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState('')

  function addFiles(fileList) {
    setFileError('')
    const files = Array.from(fileList)
    const accepted = []

    for (const file of files) {
      const error = validateImageFile(file)
      if (error) {
        setFileError(error)
        continue
      }
      accepted.push({
        key: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        url: URL.createObjectURL(file),
        isNew: true,
        file,
      })
    }

    if (accepted.length > 0) {
      onChange([...images, ...accepted])
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  function handleRemove(key) {
    onChange(images.filter((img) => img.key !== key))
  }

  function handleMove(index, direction) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= images.length) return
    const next = [...images]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    onChange(next)
  }

  return (
    <div className="image-uploader">
      <div
        className={`image-uploader__dropzone ${dragOver ? 'is-dragover' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <p>Drag photos here, or</p>
        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          Browse Photos
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          hidden
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <p className="image-uploader__hint">JPG, PNG or WEBP &middot; up to 8MB each</p>
      </div>

      {fileError && (
        <p className="admin-auth-error" role="alert">
          {fileError}
        </p>
      )}

      {images.length > 0 && (
        <ul className="image-uploader__grid">
          {images.map((img, index) => {
            const isPrimary = index === 0
            return (
              <li key={img.key} className="image-uploader__item">
                <div className="image-uploader__thumb">
                  <img src={img.url} alt="Garland" />
                  {isPrimary ? (
                    <span className="image-uploader__badge">Primary</span>
                  ) : (
                    <span className="image-uploader__badge image-uploader__badge--muted">
                      #{index + 1}
                    </span>
                  )}
                </div>
                <div className="image-uploader__reorder">
                  <button
                    type="button"
                    className="image-uploader__reorder-btn"
                    onClick={() => handleMove(index, -1)}
                    disabled={disabled || index === 0}
                    aria-label="Move photo earlier"
                    title="Move left"
                  >
                    &#8592;
                  </button>
                  <button
                    type="button"
                    className="image-uploader__reorder-btn"
                    onClick={() => handleMove(index, 1)}
                    disabled={disabled || index === images.length - 1}
                    aria-label="Move photo later"
                    title="Move right"
                  >
                    &#8594;
                  </button>
                </div>
                <div className="image-uploader__actions">
                  {!isPrimary && (
                    <button
                      type="button"
                      className="image-uploader__link"
                      onClick={() => onSetPrimary(img.key)}
                      disabled={disabled}
                    >
                      Set as primary
                    </button>
                  )}
                  <button
                    type="button"
                    className="image-uploader__link image-uploader__link--danger"
                    onClick={() => handleRemove(img.key)}
                    disabled={disabled}
                  >
                    Remove
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
