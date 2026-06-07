import { useState, useEffect, useCallback } from 'react'
import VideoBackground from './components/VideoBackground'
import Clock from './components/Clock'
import Greeting from './components/Greeting'
import SettingsPanel from './components/SettingsPanel'
import { loadVideo } from './utils/db'
import './App.css'

const DEFAULT_SETTINGS = {
  overlayOpacity: 0.35,
  accentColor: '#f0c040',
}

export default function App() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('newtab_settings')
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS
  })

  const [uploadedVideo, setUploadedVideo] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    localStorage.setItem('newtab_settings', JSON.stringify(settings))
  }, [settings])

  const refreshUploaded = useCallback(async () => {
    const video = await loadVideo()
    setUploadedVideo(video)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUploaded()
  }, [refreshUploaded])

  const videoUrl = uploadedVideo ? URL.createObjectURL(uploadedVideo.blob) : null

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
    }
  }, [videoUrl])

  const handleChange = (newSettings) => {
    setSettings(newSettings)
  }

  return (
    <div className="app" style={{ '--accent': settings.accentColor }}>
      <VideoBackground
        src={videoUrl}
        overlayOpacity={settings.overlayOpacity}
      />

      <div className="content">
        <Clock />
        <Greeting />
      </div>

      <button
        className="settings-btn"
        onClick={() => setShowSettings(true)}
        title="Settings"
      >
        ⚙
      </button>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          uploadedVideo={uploadedVideo}
          onChange={handleChange}
          onUploadedChange={refreshUploaded}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
