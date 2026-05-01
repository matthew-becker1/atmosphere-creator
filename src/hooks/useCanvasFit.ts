import { useState, useEffect, useRef, useLayoutEffect } from 'react'

function computeScale(containerWidth: number, containerHeight: number, canvasWidth: number, canvasHeight: number) {
  const paddingX = 80  // horizontal padding
  const paddingY = 120 // vertical padding (accounts for floating panels and bottom bar)
  const scaleX = (containerWidth - paddingX) / canvasWidth
  const scaleY = (containerHeight - paddingY) / canvasHeight
  return Math.min(scaleX, scaleY, 1)
}

export function useCanvasFit(width: number, height: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)

  // Calculate initial scale on mount
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      setScale(computeScale(rect.width, rect.height, width, height))
    }
  }, [width, height])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const { width: cw, height: ch } = entries[0].contentRect
      if (cw > 0 && ch > 0) {
        setScale(computeScale(cw, ch, width, height))
      }
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
