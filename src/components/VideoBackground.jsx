import { useRef, useEffect, useState } from 'react'

export default function VideoBackground({ src, overlayOpacity }) {
  const videoRef = useRef(null)
  const [hasError, setHasError] = useState(false)
  const [prevSrc, setPrevSrc] = useState(src)

  // 切换视频时在渲染阶段重置错误状态（React 官方的“props 变化时调整 state”模式）
  if (prevSrc !== src) {
    setPrevSrc(src)
    setHasError(false)
  }

  useEffect(() => {
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

      {/* 无视频时不盖遮罩，让兜底背景直接呈现浏览器主题色 */}
      {src && (
        <div
          className="video-overlay"
          style={{ background: `rgba(0, 0, 0, ${overlayOpacity})` }}
        />
      )}
    </div>
  )
}
