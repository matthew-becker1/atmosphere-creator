import { useStore } from '../../store/useStore'
import { computeToleranceBounds } from '../../lib/geometry'
import type { CircleRole } from '../../types'

const CIRCLE_COLORS: Record<string, string> = {
  depth: '#aa88cc',
  main: '#6688ff',
  highlight: '#88ddff',
}

interface Props {
  radius: number
  activeRole: CircleRole | null
}

export function GuideOverlay({ radius, activeRole }: Props) {
  const { width: W, height: H, circles } = useStore()

  const visibleCircles = activeRole
    ? circles.filter((c) => c.role === activeRole)
    : circles

  const gridLines = []
  if (!activeRole) {
    for (let i = 1; i <= 2; i++) {
      gridLines.push(
        <line key={`gv${i}`} x1={W * i / 3} y1={0} x2={W * i / 3} y2={H}
              stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="6 4" />,
        <line key={`gh${i}`} x1={0} y1={H * i / 3} x2={W} y2={H * i / 3}
              stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="6 4" />
      )
    }
  }

  return (
    <g id="guides" style={{ pointerEvents: 'none' }}>
      {gridLines}
      {visibleCircles.map((c) => {
        const bounds = computeToleranceBounds(c.anchorX, c.anchorY, W, H)
        const anchorPx = c.anchorX * W
        const anchorPy = c.anchorY * H
        const color = CIRCLE_COLORS[c.role]
        const crossSize = Math.max(16, W * 0.015)

        return (
          <g key={c.role}>
            <rect
              x={bounds.minX} y={bounds.minY}
              width={bounds.maxX - bounds.minX}
              height={bounds.maxY - bounds.minY}
              fill="none" stroke={color} strokeWidth={2}
              strokeDasharray="12 6" opacity={0.5}
            />
            <line x1={anchorPx - crossSize} y1={anchorPy} x2={anchorPx + crossSize} y2={anchorPy}
                  stroke={color} strokeWidth={2} opacity={0.9} />
            <line x1={anchorPx} y1={anchorPy - crossSize} x2={anchorPx} y2={anchorPy + crossSize}
                  stroke={color} strokeWidth={2} opacity={0.9} />
            <circle cx={c.x} cy={c.y} r={radius}
                    fill="none" stroke={color} strokeWidth={2}
                    strokeDasharray="16 8" opacity={0.3} />
          </g>
        )
      })}
    </g>
  )
}
