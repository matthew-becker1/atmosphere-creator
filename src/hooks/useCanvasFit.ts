import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'

function computeFitScale(containerWidth: number, containerHeight: number, canvasWidth: number, canvasHeight: number) {
  const paddingX = 100
  const paddingY = 40 // minimal vertical padding since top/bottom bars are outside this container
  const availableW = containerWidth - paddingX
  const availableH = containerHeight - paddingY
  if (availableW <= 0 || availableH <= 0) return 0.1
  const scaleX = availableW / canvasWidth
  const scaleY = availableH / canvasHeight
  return Math.min(scaleX, scaleY)
}

export function useCanvasFit(width: number, height: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fitScale, setFitScale] = useState(0.5)
  const [manualScale, setManualScale] = useState<number | null>(null)

  const scale = manualScale ?? fitScale

  // Calculate fit scale on mount and resize
  const updateFitScale = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      const newFit = computeFitScale(rect.width, rect.height, width, height)
      setFitScale(newFit)
      // Reset manual scale when canvas dimensions change
      setManualScale(null)
    }
  }, [width, height])

  useLayoutEffect(() => {
    updateFitScale()
  }, [updateFitScale])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver(() => {
      updateFitScale()
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [updateFitScale])

  const setScale = useCallback((newScale: number) => {
    const clamped = Math.max(0.05, Math.min(2, newScale))
    setManualScale(clamped)
  }, [])

  const resetToFit = useCallback(() => {
    setManualScale(null)
  }, [])

  return {
    containerRef,
    scale,
    fitScale,
    setScale,
    resetToFit,
    isManualScale: manualScale !== null,
    displayWidth: Math.round(width * scale),
    displayHeight: Math.round(height * scale),
  }
}
