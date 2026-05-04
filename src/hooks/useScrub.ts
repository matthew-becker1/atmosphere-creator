import { useRef, useCallback } from 'react'

export function useScrub(
  value: number,
  onChange: (v: number) => void,
  min: number,
  max: number,
  sensitivity = 1
) {
  const startRef = useRef<{ x: number; value: number } | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    startRef.current = { x: e.clientX, value }
  }, [value])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!startRef.current) return
    const speed = e.shiftKey ? 10 : 1
    const delta = Math.round((e.clientX - startRef.current.x) * sensitivity * speed)
    onChange(Math.min(max, Math.max(min, startRef.current.value + delta)))
  }, [onChange, min, max, sensitivity])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    ;(e.target as Element).releasePointerCapture(e.pointerId)
    startRef.current = null
  }, [])

  const onPointerCancel = useCallback((e: React.PointerEvent) => {
    ;(e.target as Element).releasePointerCapture(e.pointerId)
    startRef.current = null
  }, [])

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel }
}
