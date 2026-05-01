import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { useCanvasFit } from '../../hooks/useCanvasFit'
import { useCanvasResize } from '../../hooks/useCanvasResize'
import { AtmosphereSvg } from './AtmosphereSvg'
import { THEMES } from '../../constants/themes'
import type { ThemeName } from '../../types'

const HANDLE_SIZE = 10
const EDGE_SIZE = 6

function DimensionInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [localValue, setLocalValue] = useState(String(value))
  const [isFocused, setIsFocused] = useState(false)

  const handleBlur = () => {
    setIsFocused(false)
    const num = parseInt(localValue, 10)
    if (!isNaN(num) && num >= 200 && num <= 4000) {
      onChange(num)
    } else {
      setLocalValue(String(value))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur()
    }
  }

  // Sync local value when external value changes (but not while focused)
  if (!isFocused && localValue !== String(value)) {
    setLocalValue(String(value))
  }

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="w-14 bg-transparent text-center text-xs text-white/60 font-mono 
        border-b border-transparent hover:border-white/20 focus:border-white/40 
        focus:text-white focus:outline-none transition-colors"
      title={label}
    />
  )
}

const THEME_NAMES: ThemeName[] = ['twilight', 'dawn', 'morning', 'day']

function ThemeSwatch({ name }: { name: ThemeName }) {
  const currentTheme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const theme = THEMES[name]
  const isActive = currentTheme === name

  return (
    <button
      onClick={() => setTheme(name)}
      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all ${
        isActive 
          ? 'bg-white/10 ring-1 ring-white/30' 
          : 'hover:bg-white/5'
      }`}
      title={name}
    >
      <div className="flex -space-x-1">
        <div 
          className="w-5 h-5 rounded-full border border-black/20" 
          style={{ backgroundColor: theme.depth }} 
        />
        <div 
          className="w-5 h-5 rounded-full border border-black/20" 
          style={{ backgroundColor: theme.main }} 
        />
        <div 
          className="w-5 h-5 rounded-full border border-black/20" 
          style={{ backgroundColor: theme.highlight }} 
        />
      </div>
      <span className={`text-[10px] capitalize ${isActive ? 'text-white/70' : 'text-white/40'}`}>
        {name}
      </span>
    </button>
  )
}

function BackgroundToggleInline() {
  const darkBackground = useStore((s) => s.darkBackground)
  const toggleBackground = useStore((s) => s.toggleBackground)

  return (
    <button
      onClick={toggleBackground}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
    >
      <div
        className="w-4 h-4 rounded-full border border-white/20"
        style={{ backgroundColor: darkBackground ? '#000000' : '#ffffff' }}
      />
      <span className="text-xs text-white/50">{darkBackground ? 'Dark' : 'Light'}</span>
    </button>
  )
}

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
  const setDimensions = useStore((s) => s.setDimensions)
  const { containerRef, scale, displayWidth, displayHeight } = useCanvasFit(width, height)
  const { handleMouseDown } = useCanvasResize(scale)

  return (
    <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center min-h-0 p-8">
      {/* Dimensions above canvas */}
      <div className="mb-3 flex items-center gap-1 text-white/40">
        <DimensionInput value={width} onChange={(w) => setDimensions(w, height)} label="Width" />
        <span className="text-xs">×</span>
        <DimensionInput value={height} onChange={(h) => setDimensions(width, h)} label="Height" />
        <span className="text-xs ml-2">·</span>
        <span className="text-xs ml-2 font-mono">{Math.round(scale * 100)}%</span>
      </div>

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
      {/* Controls below canvas */}
      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="flex items-center gap-1">
          {THEME_NAMES.map((name) => (
            <ThemeSwatch key={name} name={name} />
          ))}
        </div>
        <BackgroundToggleInline />
      </div>
    </div>
  )
}
