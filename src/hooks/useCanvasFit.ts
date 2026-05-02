import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'
import { useStore } from '../store/useStore'

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
  const lastContainerSize = useRef({ w: 0, h: 0 })
  const isResizing = useStore((s) => s.isResizing)

  const scale = manualScale ?? fitScale

  // Compute fit scale without triggering re-renders during drag
  const computeAndSetFit = useCallback((containerW: number, containerH: number) => {
    const newFit = computeFitScale(containerW, containerH, width, height)
    setFitScale(newFit)
  }, [width, height])

  // Initial calculation and when container resizes
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      lastContainerSize.current = { w: rect.width, h: rect.height }
      computeAndSetFit(rect.width, rect.height)
    }
  }, [computeAndSetFit])

  // Recalculate when canvas dimensions change (use last known container size)
  // Skip during resize - will recalculate when resize ends
  useEffect(() => {
    if (isResizing) return
    const { w, h } = lastContainerSize.current
    if (w > 0 && h > 0) {
      computeAndSetFit(w, h)
    }
  }, [width, height, isResizing, computeAndSetFit])

  // Watch for container resize
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
