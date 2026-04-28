import { useStore } from '../../store/useStore'
import { computeRadius, computeDefaultBlur } from '../../lib/geometry'
import { GuideOverlay } from './GuideOverlay'
import { DragHandle } from './DragHandle'

interface Props {
  scale: number
  displayWidth: number
  displayHeight: number
}

export function AtmosphereSvg({ scale, displayWidth, displayHeight }: Props) {
  const { width: W, height: H, circles, layerOrder, showGuides, draggingRole, noiseIntensity, darkBackground } = useStore()
  const bgColor = darkBackground ? '#000000' : '#ffffff'
  const orderedCircles = layerOrder.map((role) => circles.find((c) => c.role === role)!)
  const radius = computeRadius(W, H)
  const blur = computeDefaultBlur(W, H)

  function filterAttrs(b: number) {
    const pad = Math.ceil((b * 4 / Math.max(radius, 1)) * 100) + 60
    return {
      x: `-${pad}%`,
      y: `-${pad}%`,
      width: `${200 + pad * 2}%`,
      height: `${200 + pad * 2}%`,
    }
  }

  const fa = filterAttrs(blur)

  return (
    <svg
      width={displayWidth}
      height={displayHeight}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block' }}
    >
      <defs>
        <filter id="blur-depth" {...fa}>
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur.toFixed(1)} />
        </filter>
        <filter id="blur-main" {...fa}>
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur.toFixed(1)} />
        </filter>
        <filter id="blur-highlight" {...fa}>
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur.toFixed(1)} />
        </filter>
        <filter id="noise-filter" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={4} stitchTiles="stitch" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          <feComponentTransfer in="grayNoise" result="scaledNoise">
            <feFuncR type="linear" slope="1" intercept="0" />
            <feFuncG type="linear" slope="1" intercept="0" />
            <feFuncB type="linear" slope="1" intercept="0" />
          </feComponentTransfer>
        </filter>
      </defs>

      <rect width={W} height={H} fill={bgColor} />

      {orderedCircles.map((c) => (
        <circle key={c.role} cx={c.x} cy={c.y} r={radius} fill={c.color} filter={`url(#blur-${c.role})`} />
      ))}

      {noiseIntensity > 0 && (
        <rect
          width={W} height={H}
          fill="transparent"
          filter="url(#noise-filter)"
          opacity={noiseIntensity}
          style={{ mixBlendMode: 'soft-light' }}
        />
      )}

      {(showGuides || draggingRole !== null) && <GuideOverlay radius={radius} activeRole={showGuides ? null : draggingRole} />}

      {circles.map((c) => (
        <DragHandle key={c.role} circle={c} scale={scale} />
      ))}
    </svg>
  )
}
