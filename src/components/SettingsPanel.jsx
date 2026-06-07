import { useState, useRef } from 'react'
import { saveVideo, deleteVideo } from '../utils/db'

const PRESET_COLORS = ['#f0c040', '#60d0f0', '#f08060', '#80e0a0', '#e080d0', '#ffffff']

export default function SettingsPanel({ settings, uploadedVideo, onChange, onUploadedChange, onClose }) {
  const [local, setLocal] = useState({ ...settings })
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)

  const update = (key, value) =>
    setLocal((prev) => ({ ...prev, [key]: value }))

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await saveVideo(file)
      await onUploadedChange()
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    await deleteVideo()
    await onUploadedChange()
  }

  const handleSave = () => {
    onChange(local)
    onClose()
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragging(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('video/')) return
    setUploading(true)
    try {
      await saveVideo(file)
      await onUploadedChange()
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="settings-backdrop" onClick={handleBackdropClick}>
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          <section className="settings-section">
            <label className="settings-label">Background Video</label>

            {uploadedVideo ? (
              <div className="uploaded-info">
                <span className="uploaded-name">{uploadedVideo.name}</span>
                <div className="uploaded-actions">
                  <button
                    className="btn-upload"
                    onClick={() => fileRef.current?.click()}
                  >
                    Change
                  </button>
                  <button className="btn-remove" onClick={handleRemove}>
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`upload-zone${dragging ? ' drag-over' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {uploading ? (
                  <span>Uploading…</span>
                ) : (
                  <>
                    <span className="upload-icon">📁</span>
                    <span>{dragging ? 'Drop it!' : 'Click or drag a video here'}</span>
                    <span className="upload-hint">.mp4, .webm, or .ogg</span>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/webm,video/ogg"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
          </section>

          <section className="settings-section">
            <label className="settings-label">
              Overlay Opacity — <strong>{Math.round(local.overlayOpacity * 100)}%</strong>
            </label>
            <input
              type="range"
              className="settings-slider"
              min="0"
              max="0.85"
              step="0.05"
              value={local.overlayOpacity}
              onChange={(e) => update('overlayOpacity', parseFloat(e.target.value))}
            />
            <div className="settings-slider-labels">
              <span>Clear</span>
              <span>Dark</span>
            </div>
          </section>

          <section className="settings-section">
            <label className="settings-label">Accent Color</label>
            <div className="color-presets">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  className={`color-dot ${local.accentColor === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => update('accentColor', c)}
                />
              ))}
              <input
                type="color"
                className="color-picker"
                value={local.accentColor}
                onChange={(e) => update('accentColor', e.target.value)}
                title="Custom color"
              />
            </div>
          </section>
        </div>

        <div className="settings-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
