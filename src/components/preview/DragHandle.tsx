import { useState } from 'react'
import type { CircleState } from '../../types'
import { useDrag } from '../../hooks/useDrag'
import { useStore } from '../../store/useStore'

interface Props {
  circle: CircleState
  scale: number
}

export function DragHandle({ circle, scale }: Props) {
  const [active, setActive] = useState(false)
  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture } = useDrag(circle.role, scale)
  const setDraggingRole = useStore((s) => s.setDraggingRole)
  const r = Math.max(20, 28 / scale)

  return (
    <circle
      cx={circle.x}
      cy={circle.y}
      r={r}
      fill={circle.color}
      fillOpacity={0.45}
      stroke="rgba(255,255,255,0.9)"
      strokeWidth={Math.max(1.5, (active ? 3 : 2) / scale)}
      style={{ cursor: active ? 'grabbing' : 'grab' }}
      onPointerDown={(e) => { setActive(true); setDraggingRole(circle.role); onPointerDown(e) }}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => { setActive(false); setDraggingRole(null); onPointerUp(e) }}
      onPointerCancel={(e) => { setActive(false); setDraggingRole(null); onPointerCancel(e) }}
      onLostPointerCapture={() => { setActive(false); setDraggingRole(null); onLostPointerCapture() }}
    />
  )
}
