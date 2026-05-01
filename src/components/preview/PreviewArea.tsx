import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { useCanvasFit } from '../../hooks/useCanvasFit'
import { useCanvasResize } from '../../hooks/useCanvasResize'
import { AtmosphereSvg } from './AtmosphereSvg'
import { THEMES } from '../../constants/themes'
import { PRESETS } from '../../constants/presets'
import { buildSvgString } from '../../lib/svgBuilder'
import { exportSvg, exportPng, exportWebp, exportJpg } from '../../lib/exportPng'
import type { ThemeName } from '../../types'

const HANDLE_SIZE = 16
const EDGE_SIZE = 8

const FIGMA_NOISE_INSTRUCTIONS = `To match noise in Figma:
1. Draw a rect over the full frame
2. Fill → + → Noise (not solid)
   Size: 200  Opacity: 8%
3. Set layer blend mode to Soft Light
4. Set layer opacity to 100%`

type ExportFormat = 'png' | 'webp' | 'jpg'

// --- Floating Panel Components ---

function FloatingPanel({ 
  title, 
  isOpen, 
  onToggle, 
  position,
  children 
}: { 
  title: string
  isOpen: boolean
  onToggle: () => void
  position: 'left' | 'right'
  children: React.ReactNode
}) {
  return (
    <div className={`absolute top-4 ${position === 'left' ? 'left-4' : 'right-4'} z-20`}>
      <button
        onClick={onToggle}
        className={`px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors ${
          isOpen 
            ? 'bg-neutral-800 text-white' 
            : 'bg-neutral-800/80 text-white/60 hover:text-white hover:bg-neutral-800'
        }`}
      >
        {title}
      </button>
      {isOpen && (
        <div className="bg-neutral-800 rounded-b-lg rounded-tr-lg p-4 min-w-[200px] shadow-xl border border-white/10">
          {children}
        </div>
      )}
    </div>
  )
}

function ExportPanel() {
  const state = useStore()
  const [rasterScale, setRasterScale] = useState<1 | 2>(2)
  const [rasterFormat, setRasterFormat] = useState<ExportFormat>('png')
  const [showNoisePopup, setShowNoisePopup] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSvgExport = () => {
    const svg = buildSvgString(state, true)
    exportSvg(svg, `atmosphere-${state.theme}-${state.width}x${state.height}.svg`)
    setShowNoisePopup(true)
  }

  const handleRasterExport = async () => {
    const svg = buildSvgString(state, true)
    const suffix = rasterScale === 2 ? '@2x' : ''
    const filename = `atmosphere-${state.theme}-${state.width}x${state.height}${suffix}.${rasterFormat}`
    
    if (rasterFormat === 'png') {
      await exportPng(svg, state.width, state.height, filename, rasterScale)
    } else if (rasterFormat === 'webp') {
      await exportWebp(svg, state.width, state.height, filename, rasterScale)
    } else {
      await exportJpg(svg, state.width, state.height, filename, rasterScale)
    }
    setShowNoisePopup(true)
  }

  const copyNoise = () => {
    navigator.clipboard.writeText(FIGMA_NOISE_INSTRUCTIONS).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <button
          onClick={handleSvgExport}
          className="w-full px-3 py-2 rounded text-sm bg-white/10 text-white hover:bg-white/20 transition-colors font-medium"
        >
          Export SVG
        </button>

        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <button
              onClick={handleRasterExport}
              className="flex-1 px-3 py-2 rounded-l text-sm bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 transition-colors"
            >
              Export {rasterFormat.toUpperCase()}
            </button>
            <div className="flex rounded-r overflow-hidden border-l border-white/10">
              <button
                onClick={() => setRasterScale(1)}
                className={`px-2 py-2 text-xs transition-colors ${rasterScale === 1 ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
              >
                1×
              </button>
              <button
                onClick={() => setRasterScale(2)}
                className={`px-2 py-2 text-xs transition-colors border-l border-white/10 ${rasterScale === 2 ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
              >
                2×
              </button>
            </div>
          </div>
          <div className="flex rounded overflow-hidden">
            {(['png', 'webp', 'jpg'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setRasterFormat(fmt)}
                className={`flex-1 px-2 py-1 text-xs transition-colors ${
                  rasterFormat === fmt 
                    ? 'bg-white/15 text-white' 
                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                } ${fmt !== 'png' ? 'border-l border-white/10' : ''}`}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showNoisePopup && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={() => setShowNoisePopup(false)}
        >
          <div
            className="bg-neutral-900 border border-white/15 rounded-xl p-6 shadow-2xl w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm font-medium text-white">Applying noise in Figma</span>
              <button onClick={() => setShowNoisePopup(false)} className="text-white/40 hover:text-white leading-none ml-3">×</button>
            </div>
            <pre className="text-xs text-white/55 leading-relaxed whitespace-pre-wrap font-mono mb-4">{FIGMA_NOISE_INSTRUCTIONS}</pre>
            <button onClick={copyNoise} className="text-xs text-white/40 hover:text-white/70 transition-colors">
              {copied ? 'Copied' : 'Copy instructions'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// --- Input Components ---

function PresetDropdown() {
  const { width, height, setDimensions } = useStore()
  const activePreset = PRESETS.find((p) => p.width === width && p.height === height)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [w, h] = e.target.value.split('x').map(Number)
    setDimensions(w, h)
  }

  return (
    <select
      value={activePreset ? `${width}x${height}` : ''}
      onChange={handleChange}
      className="bg-white/5 text-white/60 text-xs rounded px-2 py-1 outline-none cursor-pointer 
        hover:bg-white/10 hover:text-white/80 transition-colors border-none appearance-none
        pr-6 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxMiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMyA1TDYgOEw5IDUiIHN0cm9rZT0iI2ZmZmZmZjgwIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+')] 
        bg-no-repeat bg-[right_6px_center]"
    >
      {!activePreset && <option value="" className="bg-neutral-900">Custom</option>}
      {PRESETS.map((p) => (
        <option key={p.label} value={`${p.width}x${p.height}`} className="bg-neutral-900">
          {p.label}
        </option>
      ))}
    </select>
  )
}

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
      className="w-12 bg-transparent text-center text-xs text-white/60 font-mono 
        border-b border-transparent hover:border-white/20 focus:border-white/40 
        focus:text-white focus:outline-none transition-colors"
      title={label}
    />
  )
}

function ZoomInput({ scale, setScale, resetToFit, isManualScale }: { 
  scale: number
  setScale: (v: number) => void
  resetToFit: () => void
  isManualScale: boolean 
}) {
  const [localValue, setLocalValue] = useState(String(Math.round(scale * 100)))
  const [isFocused, setIsFocused] = useState(false)

  const handleBlur = () => {
    setIsFocused(false)
    const num = parseInt(localValue, 10)
    if (!isNaN(num) && num >= 5 && num <= 200) {
      setScale(num / 100)
    } else {
      setLocalValue(String(Math.round(scale * 100)))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur()
    }
  }

  // Sync with external scale changes
  if (!isFocused && localValue !== String(Math.round(scale * 100))) {
    setLocalValue(String(Math.round(scale * 100)))
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-8 bg-transparent text-center text-xs text-white/40 font-mono 
          border-b border-transparent hover:border-white/20 focus:border-white/40 
          focus:text-white focus:outline-none transition-colors"
        title="Zoom %"
      />
      <span className="text-xs text-white/25">%</span>
      {isManualScale && (
        <button
          onClick={resetToFit}
          className="ml-1 text-[10px] text-white/30 hover:text-white/60 transition-colors"
          title="Reset to fit"
        >
          Fit
        </button>
      )}
    </div>
  )
}

const THEME_NAMES: ThemeName[] = ['twilight', 'dawn', 'morning', 'day']

function LogoToggle() {
  const showLogo = useStore((s) => s.showLogo)
  const toggleLogo = useStore((s) => s.toggleLogo)

  return (
    <button
      onClick={toggleLogo}
      className={`mr-6 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
        showLogo ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
      }`}
      title="Toggle logo"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 12h6M12 9v6" />
      </svg>
      <span className="text-[10px] uppercase tracking-wide">Logo</span>
    </button>
  )
}

function GuidesToggle() {
  const showGuides = useStore((s) => s.showGuides)
  const toggleGuides = useStore((s) => s.toggleGuides)

  return (
    <button
      onClick={toggleGuides}
      className={`ml-6 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
        showGuides ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
      }`}
      title="Toggle guides"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M3 12h18" />
      </svg>
      <span className="text-[10px] uppercase tracking-wide">Guides</span>
    </button>
  )
}

function ThemeSwatch({ name }: { name: ThemeName }) {
  const currentTheme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const theme = THEMES[name]
  const isActive = currentTheme === name

  return (
    <button
      onClick={() => setTheme(name)}
      className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
        isActive 
          ? 'bg-white/10 ring-1 ring-white/30' 
          : 'hover:bg-white/5'
      }`}
      title={name}
    >
      <div className="flex -space-x-1">
        <div className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: theme.depth }} />
        <div className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: theme.main }} />
        <div className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: theme.highlight }} />
      </div>
      <span className={`text-[9px] capitalize ${isActive ? 'text-white/70' : 'text-white/40'}`}>{name}</span>
    </button>
  )
}

function BackgroundToggle() {
  const darkBackground = useStore((s) => s.darkBackground)
  const toggleBackground = useStore((s) => s.toggleBackground)

  return (
    <button
      onClick={toggleBackground}
      className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
    >
      <div
        className="w-3 h-3 rounded-full border border-white/20"
        style={{ backgroundColor: darkBackground ? '#000000' : '#ffffff' }}
      />
      <span className="text-[10px] text-white/50">{darkBackground ? 'Dark' : 'Light'}</span>
    </button>
  )
}

// --- Resize Handles ---

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
    n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
    ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize',
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
      className={`absolute ${isCorner ? 'bg-white/50 rounded hover:bg-white z-20' : 'bg-transparent hover:bg-white/20 z-10'} transition-colors`}
      style={{ ...positionStyles[position], cursor: cursorMap[position] }}
    />
  )
}

// --- Main Preview Area ---

export function PreviewArea() {
  const { width, height, isResizing } = useStore()
  const setDimensions = useStore((s) => s.setDimensions)
  const { containerRef, scale, setScale, resetToFit, isManualScale, displayWidth, displayHeight } = useCanvasFit(width, height)
  const { handleMouseDown } = useCanvasResize(scale)
  
  const [exportOpen, setExportOpen] = useState(false)

  return (
    <div className="flex-1 relative flex flex-col min-h-0 bg-neutral-950">
      {/* Export floating panel */}
      <FloatingPanel title="Export" isOpen={exportOpen} onToggle={() => setExportOpen(!exportOpen)} position="right">
        <ExportPanel />
      </FloatingPanel>

      {/* Top bar: Dimensions */}
      <div className="flex-shrink-0 flex justify-center py-3">
        <div className="flex items-center gap-3">
          <PresetDropdown />
          <div className="flex items-center gap-1 text-white/40">
            <DimensionInput value={width} onChange={(w) => setDimensions(w, height)} label="Width" />
            <span className="text-xs">×</span>
            <DimensionInput value={height} onChange={(h) => setDimensions(width, h)} label="Height" />
          </div>
          <ZoomInput scale={scale} setScale={setScale} resetToFit={resetToFit} isManualScale={isManualScale} />
        </div>
      </div>

      {/* Canvas area with side toggles */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center px-4 min-h-0 overflow-hidden">
        {/* Logo toggle - left */}
        <LogoToggle />

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
          
          <div className={`transition-opacity ${isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {/* Edge handles first (lower z-index) */}
            <ResizeHandle position="n" onMouseDown={handleMouseDown('n')} />
            <ResizeHandle position="s" onMouseDown={handleMouseDown('s')} />
            <ResizeHandle position="e" onMouseDown={handleMouseDown('e')} />
            <ResizeHandle position="w" onMouseDown={handleMouseDown('w')} />
            {/* Corner handles last (higher z-index, rendered on top) */}
            <ResizeHandle position="ne" onMouseDown={handleMouseDown('ne')} />
            <ResizeHandle position="nw" onMouseDown={handleMouseDown('nw')} />
            <ResizeHandle position="se" onMouseDown={handleMouseDown('se')} />
            <ResizeHandle position="sw" onMouseDown={handleMouseDown('sw')} />
          </div>
        </div>

        {/* Guides toggle - right */}
        <GuidesToggle />
      </div>

      {/* Bottom bar: Themes */}
      <div className="flex-shrink-0 flex justify-center py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {THEME_NAMES.map((name) => (
              <ThemeSwatch key={name} name={name} />
            ))}
          </div>
          <BackgroundToggle />
        </div>
      </div>
    </div>
  )
}
