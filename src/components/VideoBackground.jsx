import { useRef, useEffect, useState } from 'react'

export default function VideoBackground({ src, overlayOpacity }) {
  const videoRef = useRef(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setHasError(false)
    if (videoRef.current) {
      videoRef.current.load()
    }
  }, [src])

  return (
    <div className="video-wrapper">
      {src && !hasError ? (
        <video
          ref={videoRef}
          className="video-bg"
          autoPlay
          muted
          loop
          playsInline
          onError={() => setHasError(true)}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : (
        <div className="video-fallback" />
      )}

      <div
        className="video-overlay"
        style={{ background: `rgba(0, 0, 0, ${overlayOpacity})` }}
      />
    </div>
  )
}
