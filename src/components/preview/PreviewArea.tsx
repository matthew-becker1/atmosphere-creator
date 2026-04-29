import { useStore } from '../../store/useStore'
import { useCanvasFit } from '../../hooks/useCanvasFit'
import { AtmosphereSvg } from './AtmosphereSvg'

export function PreviewArea() {
  const { width, height } = useStore()
  const { containerRef, scale, displayWidth, displayHeight } = useCanvasFit(width, height)

  return (
    <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center min-h-0 p-8">
      <div
        style={{
          width: displayWidth,
          height: displayHeight,
          flexShrink: 0,
          boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 8px 40px rgba(0,0,0,0.7)',
        }}
      >
        <AtmosphereSvg scale={scale} displayWidth={displayWidth} displayHeight={displayHeight} />
      </div>
      <p className="mt-3 text-xs text-white/25">
        {width} × {height} &nbsp;·&nbsp; {Math.round(scale * 100)}%
      </p>
    </div>
  )
}
