import { useStore } from '../../store/useStore'
import type { CircleRole } from '../../types'

const GUIDE_COLOR = '#ff2040'

interface Props {
  radius: number
  activeRole: CircleRole | null
}

function Arrow({ x, y, dir, size }: {
  x: number; y: number
  dir: 'up' | 'down' | 'left' | 'right'
  size: number
}) {
  const s = size
  let points: string
  switch (dir) {
    case 'up':    points = `${x},${y - s} ${x - s * 0.55},${y + s * 0.45} ${x + s * 0.55},${y + s * 0.45}`; break
    case 'down':  points = `${x},${y + s} ${x - s * 0.55},${y - s * 0.45} ${x + s * 0.55},${y - s * 0.45}`; break
    case 'left':  points = `${x - s},${y} ${x + s * 0.45},${y - s * 0.55} ${x + s * 0.45},${y + s * 0.55}`; break
    case 'right': points = `${x + s},${y} ${x - s * 0.45},${y - s * 0.55} ${x - s * 0.45},${y + s * 0.55}`; break
  }
  return <polygon points={points} fill={GUIDE_COLOR} opacity={0.95} />
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
              stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="6 4" />,
        <line key={`gh${i}`} x1={0} y1={H * i / 3} x2={W} y2={H * i / 3}
              stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="6 4" />
      )
    }
  }

  const arrowSize = Math.max(7, W * 0.008)
  const crossSize = Math.max(16, W * 0.015)

  return (
    <g id="guides" style={{ pointerEvents: 'none' }}>
      {gridLines}
      {visibleCircles.map((c) => {
        const anchorPx = c.anchorX * W
        const anchorPy = c.anchorY * H
        const isDragging = c.role === activeRole

        const sw = 3.5
        const opacity = isDragging ? 0.9 : 0.7

        let constraintGuide: React.ReactNode = null

        if (c.role === 'depth') {
          constraintGuide = (
            <g>
              <polyline points={`0,${2*H/3} 0,${H} ${W/3},${H}`}
                fill="none" stroke={GUIDE_COLOR} strokeWidth={14} opacity={isDragging ? 0.12 : 0.07}
                strokeLinecap="round" strokeLinejoin="round" />
              <polyline points={`0,${2*H/3} 0,${H} ${W/3},${H}`}
                fill="none" stroke={GUIDE_COLOR} strokeWidth={sw} opacity={opacity}
                strokeLinecap="round" strokeLinejoin="round" />
              {/* arrows at endpoints pointing away from corner */}
              <Arrow x={0}    y={2*H/3} dir="up"    size={arrowSize} />
              <Arrow x={W/3}  y={H}     dir="right" size={arrowSize} />
            </g>
          )
        } else if (c.role === 'highlight') {
          constraintGuide = (
            <g>
              <polyline points={`${2*W/3},0 ${W},0 ${W},${H/3}`}
                fill="none" stroke={GUIDE_COLOR} strokeWidth={14} opacity={isDragging ? 0.12 : 0.07}
                strokeLinecap="round" strokeLinejoin="round" />
              <polyline points={`${2*W/3},0 ${W},0 ${W},${H/3}`}
                fill="none" stroke={GUIDE_COLOR} strokeWidth={sw} opacity={opacity}
                strokeLinecap="round" strokeLinejoin="round" />
              {/* arrows at endpoints pointing away from corner */}
              <Arrow x={2*W/3} y={0}    dir="left" size={arrowSize} />
              <Arrow x={W}     y={H/3}  dir="down"  size={arrowSize} />
            </g>
          )
        } else if (c.role === 'main') {
          constraintGuide = (
            <rect x={W/3} y={H/3} width={W/3} height={H/3}
              fill="none" stroke={GUIDE_COLOR} strokeWidth={isDragging ? sw : 2} opacity={opacity} />
          )
        }

        return (
          <g key={c.role}>
            {constraintGuide}
            <line x1={anchorPx - crossSize} y1={anchorPy} x2={anchorPx + crossSize} y2={anchorPy}
                  stroke={GUIDE_COLOR} strokeWidth={1.5} opacity={0.4} />
            <line x1={anchorPx} y1={anchorPy - crossSize} x2={anchorPx} y2={anchorPy + crossSize}
                  stroke={GUIDE_COLOR} strokeWidth={1.5} opacity={0.4} />
            <circle cx={c.x} cy={c.y} r={radius}
                    fill="none" stroke={GUIDE_COLOR} strokeWidth={isDragging ? 2.5 : 1.5}
                    strokeDasharray="16 8" opacity={isDragging ? 0.5 : 0.2} />
          </g>
        )
      })}
    </g>
  )
}
