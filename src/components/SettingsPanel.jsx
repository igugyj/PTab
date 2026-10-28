import { useState, useRef } from 'react'
import { saveVideo, deleteVideo } from '../utils/db'

const PRESET_COLORS = ['#f0c040', '#60d0f0', '#f08060', '#80e0a0', '#e080d0', '#ffffff']

// 时钟位置九宫格（3x3），顺序即渲染顺序
const CLOCK_POSITIONS = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br']
const POSITION_LABELS = {
  tl: 'Top left',
  tc: 'Top center',
  tr: 'Top right',
  ml: 'Middle left',
  mc: 'Center',
  mr: 'Middle right',
  bl: 'Bottom left',
  bc: 'Bottom center',
  br: 'Bottom right',
}

export default function SettingsPanel({ settings, uploadedVideo, onChange, onUploadedChange, onClose }) {
  const [local, setLocal] = useState({ ...settings })
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)
  const dragCounter = useRef(0) // 记录拖拽进入层级，避免子元素触发 dragleave 误判

  const update = (key, value) =>
    setLocal((prev) => ({ ...prev, [key]: value }))

  const isFileDrag = (e) =>
    Array.from(e.dataTransfer?.types || []).includes('Files')

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

  // 拖拽事件挂在全屏遮罩上：整页都是判定区域，配合计数器抵消子元素的 enter/leave
  const handleDragEnter = (e) => {
    e.preventDefault()
    if (!isFileDrag(e)) return
    dragCounter.current += 1
    setDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    if (dragCounter.current === 0) return
    dragCounter.current -= 1
    if (dragCounter.current === 0) setDragging(false)
  }

  const handleDragOver = (e) => {
    if (isFileDrag(e)) e.preventDefault()
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    dragCounter.current = 0
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
    <div
      className="settings-backdrop"
      onClick={handleBackdropClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
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
            <label className="settings-label">Display</label>
            <div className="settings-toggle-row">
              <span className="settings-toggle-text">Clock and date</span>
              <button
                type="button"
                role="switch"
                aria-checked={local.showClock}
                className={`settings-toggle${local.showClock ? ' on' : ''}`}
                onClick={() => update('showClock', !local.showClock)}
              >
                <span className="settings-toggle-knob" />
              </button>
            </div>
          </section>

          <section className="settings-section">
            <label className="settings-label">Clock Position</label>
            <div className="pos-grid">
              {CLOCK_POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  className={`pos-cell pos-${pos}${local.clockPos === pos ? ' active' : ''}`}
                  onClick={() => update('clockPos', pos)}
                  title={POSITION_LABELS[pos]}
                  aria-label={POSITION_LABELS[pos]}
                  aria-pressed={local.clockPos === pos}
                />
              ))}
            </div>
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
