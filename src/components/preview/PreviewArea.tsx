import { useStore } from '../../store/useStore'
import { useCanvasFit } from '../../hooks/useCanvasFit'
import { useCanvasResize } from '../../hooks/useCanvasResize'
import { AtmosphereSvg } from './AtmosphereSvg'

const HANDLE_SIZE = 10
const EDGE_SIZE = 6

function ResizeHandle({ 
  position, 
  onMouseDown 
}: { 
  position: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
  onMouseDown: (e: React.MouseEvent) => void 
}) {
  const isCorner = position.length === 2
  const size = isCorner ? HANDLE_SIZE : EDGE_SIZE

  const cursorMap: Record<string, string> = {
    n: 'ns-resize',
    s: 'ns-resize',
    e: 'ew-resize',
    w: 'ew-resize',
    ne: 'nesw-resize',
    sw: 'nesw-resize',
    nw: 'nwse-resize',
    se: 'nwse-resize',
  }

  const positionStyles: Record<string, React.CSSProperties> = {
    n: { top: -size / 2, left: '50%', transform: 'translateX(-50%)', width: '40%', height: size },
    s: { bottom: -size / 2, left: '50%', transform: 'translateX(-50%)', width: '40%', height: size },
    e: { right: -size / 2, top: '50%', transform: 'translateY(-50%)', width: size, height: '40%' },
    w: { left: -size / 2, top: '50%', transform: 'translateY(-50%)', width: size, height: '40%' },
    ne: { top: -size / 2, right: -size / 2, width: size, height: size },
    nw: { top: -size / 2, left: -size / 2, width: size, height: size },
    se: { bottom: -size / 2, right: -size / 2, width: size, height: size },
    sw: { bottom: -size / 2, left: -size / 2, width: size, height: size },
  }

  return (
    <div
      onMouseDown={onMouseDown}
      className={`absolute ${isCorner ? 'bg-white/60 rounded-sm hover:bg-white' : 'bg-transparent hover:bg-white/30'} transition-colors`}
      style={{
        ...positionStyles[position],
        cursor: cursorMap[position],
      }}
    />
  )
}

export function PreviewArea() {
  const { width, height } = useStore()
  const { containerRef, scale, displayWidth, displayHeight } = useCanvasFit(width, height)
  const { handleMouseDown } = useCanvasResize(scale)

  return (
    <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center min-h-0 p-8">
      <div
        className="relative group"
        style={{
          width: displayWidth,
          height: displayHeight,
          flexShrink: 0,
          boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 8px 40px rgba(0,0,0,0.7)',
        }}
      >
        <AtmosphereSvg scale={scale} displayWidth={displayWidth} displayHeight={displayHeight} />
        
        {/* Resize handles - visible on hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ResizeHandle position="n" onMouseDown={handleMouseDown('n')} />
          <ResizeHandle position="s" onMouseDown={handleMouseDown('s')} />
          <ResizeHandle position="e" onMouseDown={handleMouseDown('e')} />
          <ResizeHandle position="w" onMouseDown={handleMouseDown('w')} />
          <ResizeHandle position="ne" onMouseDown={handleMouseDown('ne')} />
          <ResizeHandle position="nw" onMouseDown={handleMouseDown('nw')} />
          <ResizeHandle position="se" onMouseDown={handleMouseDown('se')} />
          <ResizeHandle position="sw" onMouseDown={handleMouseDown('sw')} />
        </div>
      </div>
      <p className="mt-3 text-xs text-white/25">
        {width} × {height} &nbsp;·&nbsp; {Math.round(scale * 100)}%
      </p>
    </div>
  )
}
