import { useState, useEffect, useRef } from 'react'

export function useCanvasFit(width: number, height: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.3)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const { width: cw, height: ch } = entries[0].contentRect
      const padding = 64
      const scaleX = (cw - padding) / width
      const scaleY = (ch - padding) / height
      setScale(Math.min(scaleX, scaleY, 1))
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [width, height])

  return {
    containerRef,
    scale,
    displayWidth: Math.round(width * scale),
    displayHeight: Math.round(height * scale),
  }
}
