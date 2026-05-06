import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'

function computeFitScale(containerWidth: number, containerHeight: number, canvasWidth: number, canvasHeight: number, paddingX = 160, paddingY = 260) {
  const availableW = containerWidth - paddingX
  const availableH = containerHeight - paddingY
  if (availableW <= 0 || availableH <= 0) return 0.1
  return Math.min(1, availableW / canvasWidth, availableH / canvasHeight)
}

export function useCanvasFit(width: number, height: number, paddingX = 160, paddingY = 260) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fitScale, setFitScale] = useState(0.5)
  const [manualScale, setManualScale] = useState<number | null>(null)
  const lastContainerSize = useRef({ w: 0, h: 0 })

  // Always cap at fitScale so controls are never pushed off screen
  const scale = manualScale !== null ? Math.min(manualScale, fitScale) : fitScale

  const computeAndSetFit = useCallback((containerW: number, containerH: number) => {
    setFitScale(computeFitScale(containerW, containerH, width, height, paddingX, paddingY))
  }, [width, height, paddingX, paddingY])

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      lastContainerSize.current = { w: rect.width, h: rect.height }
      computeAndSetFit(rect.width, rect.height)
    }
  }, [computeAndSetFit])

  // Always keep fitScale current — including during resize
  useEffect(() => {
    const { w, h } = lastContainerSize.current
    if (w > 0 && h > 0) computeAndSetFit(w, h)
  }, [width, height, computeAndSetFit])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const { width: cw, height: ch } = entries[0].contentRect
      if (cw > 0 && ch > 0) {
        lastContainerSize.current = { w: cw, h: ch }
        computeAndSetFit(cw, ch)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [computeAndSetFit])

  const setScale = useCallback((newScale: number) => {
    setManualScale(Math.max(0.05, Math.min(2, newScale)))
  }, [])

  const resetToFit = useCallback(() => setManualScale(null), [])

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
