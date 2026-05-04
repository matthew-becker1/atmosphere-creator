import { useRef, useCallback } from 'react'
import type { CircleRole } from '../types'
import { useStore } from '../store/useStore'

export function useDrag(role: CircleRole, scale: number) {
  const setCirclePosition = useStore((s) => s.setCirclePosition)
  const getCircles = () => useStore.getState().circles
  const isDragging = useRef(false)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDragging.current = true
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return
      e.preventDefault()
      const circle = getCircles().find((c) => c.role === role)!
      const newX = circle.x + e.movementX / scale
      const newY = circle.y + e.movementY / scale
      setCirclePosition(role, newX, newY)
    },
    [role, scale, setCirclePosition]
  )

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    isDragging.current = false
    ;(e.target as Element).releasePointerCapture(e.pointerId)
  }, [])

  const onPointerCancel = useCallback((e: React.PointerEvent) => {
    isDragging.current = false
    ;(e.target as Element).releasePointerCapture(e.pointerId)
  }, [])

  const onLostPointerCapture = useCallback(() => {
    isDragging.current = false
  }, [])

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture }
}
