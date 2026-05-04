import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { useCanvasFit } from '../../hooks/useCanvasFit'
import { useCanvasResize } from '../../hooks/useCanvasResize'
import { useScrub } from '../../hooks/useScrub'
import { AtmosphereSvg } from './AtmosphereSvg'
import { NoiseControl } from '../controls/NoiseControl'
import { THEMES, THEME_NAMES } from '../../constants/themes'
import { PRESETS } from '../../constants/presets'
import { TRIPTYCH_PANEL_W, TRIPTYCH_PANEL_H, TRIPTYCH_TOTAL_W, TRIPTYCH_PANELS } from '../../constants/triptych'
import { buildSvgString } from '../../lib/svgBuilder'
import { exportSvg, exportPng, exportWebp, exportJpg, exportTriptychPanel } from '../../lib/exportPng'
import type { ImageFormat } from '../../lib/exportPng'
import type { ThemeName } from '../../types'

const HANDLE_SIZE = 16
const EDGE_SIZE = 8

const FIGMA_NOISE_INSTRUCTIONS = `To match noise in Figma:
1. Draw a rect over the full frame
2. Fill → + → Noise (not solid)
   Size: 200  Opacity: 8%
3. Set layer blend mode to Soft Light
4. Set layer opacity to 100%`

// --- Floating Panel Components ---


function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex bg-white/[0.04] rounded-lg overflow-hidden divide-x divide-white/[0.06] border border-white/[0.06]">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-1.5 text-xs transition-colors ${
            value === opt.value ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function stateForTheme(theme: ThemeName) {
  const base = useStore.getState()
  return {
    ...base,
    theme,
    circles: base.circles.map((c) => ({ ...c, color: THEMES[theme][c.role] })) as typeof base.circles,
  }
}

type ExportFormat = 'svg' | ImageFormat

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function ExportPanel({ isTriptych }: { isTriptych: boolean }) {
  const [format, setFormat] = useState<ExportFormat>('png')
  const [rasterScale, setRasterScale] = useState<1 | 2>(1)
  const [showNoisePopup, setShowNoisePopup] = useState(false)
  const [copied, setCopied] = useState(false)
  const [batchProgress, setBatchProgress] = useState<number | null>(null)
  const { theme, width, height } = useStore((s) => ({ theme: s.theme, width: s.width, height: s.height }))

  const isSvg = format === 'svg'
  const isBusy = batchProgress !== null
  const batchTotal = isTriptych ? THEME_NAMES.length * TRIPTYCH_PANELS.length : THEME_NAMES.length

  // Filename preview
  const scaleSuffix = !isSvg && rasterScale === 2 ? '@2x' : ''
  const dimStr = isTriptych ? `${TRIPTYCH_PANEL_W}×${TRIPTYCH_PANEL_H}` : `${width}×${height}`
  const filenamePreview = isTriptych
    ? `atmosphere-triptych-${theme}-[panel]-${dimStr}${scaleSuffix}.${format}`
    : `atmosphere-${theme}-${dimStr}${scaleSuffix}.${format}`

  // Per-format file sizes
  const [sizes, setSizes] = useState<Record<ExportFormat, string | null>>({
    svg: null, png: null, webp: null, jpg: null,
  })

  // SVG size — instant, no scale dependency
  useEffect(() => {
    const state = useStore.getState()
    const svgStr = isTriptych
      ? buildSvgString(state, { x: 0, w: TRIPTYCH_PANEL_W, h: TRIPTYCH_PANEL_H })
      : buildSvgString(state)
    setSizes((s) => ({ ...s, svg: formatBytes(new TextEncoder().encode(svgStr).length) }))
  }, [isTriptych, theme, width, height])

  // Raster sizes — render one panel SVG at scale, measure all 3 formats from same canvas
  useEffect(() => {
    setSizes((s) => ({ ...s, png: null, webp: null, jpg: null }))
    let cancelled = false
    const state = useStore.getState()

    // Always render a single-panel SVG — avoids giant triptych canvas at 2×
    const panelSvg = isTriptych
      ? buildSvgString(state, { x: 0, w: TRIPTYCH_PANEL_W, h: TRIPTYCH_PANEL_H })
      : buildSvgString(state)
    const sw = (isTriptych ? TRIPTYCH_PANEL_W : state.width) * rasterScale
    const sh = (isTriptych ? TRIPTYCH_PANEL_H : state.height) * rasterScale

    const blob = new Blob([panelSvg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)
      if (cancelled) return
      const canvas = document.createElement('canvas')
      canvas.width = sw; canvas.height = sh
      canvas.getContext('2d')!.drawImage(img, 0, 0, sw, sh)
      const fmts: Array<{ key: ImageFormat; mime: string; q: number }> = [
        { key: 'png',  mime: 'image/png',   q: 1    },
        { key: 'webp', mime: 'image/webp',  q: 0.92 },
        { key: 'jpg',  mime: 'image/jpeg',  q: 0.92 },
      ]
      for (const { key, mime, q } of fmts) {
        canvas.toBlob((b) => {
          if (!cancelled && b) setSizes((s) => ({ ...s, [key]: formatBytes(b.size) }))
        }, mime, q)
      }
    }
    img.onerror = () => URL.revokeObjectURL(url)
    img.src = url
    return () => { cancelled = true }
  }, [rasterScale, isTriptych, theme, width, height])

  const handleExport = async () => {
    const state = useStore.getState()
    const suffix = !isSvg && rasterScale === 2 ? '@2x' : ''
    if (isSvg) {
      if (isTriptych) {
        for (let i = 0; i < TRIPTYCH_PANELS.length; i++) {
          setBatchProgress(i + 1)
          const panel = TRIPTYCH_PANELS[i]
          const svg = buildSvgString(state, { x: panel.x, w: TRIPTYCH_PANEL_W, h: TRIPTYCH_PANEL_H })
          exportSvg(svg, `atmosphere-triptych-${state.theme}-${panel.label}-${TRIPTYCH_PANEL_W}x${TRIPTYCH_PANEL_H}.svg`)
          await new Promise((r) => setTimeout(r, 80))
        }
        setBatchProgress(null)
      } else {
        exportSvg(buildSvgString(state), `atmosphere-${state.theme}-${state.width}x${state.height}.svg`)
      }
      setShowNoisePopup(true)
    } else {
      const fmt = format as ImageFormat
      if (isTriptych) {
        const fullSvg = buildSvgString(state)
        for (let i = 0; i < TRIPTYCH_PANELS.length; i++) {
          setBatchProgress(i + 1)
          const panel = TRIPTYCH_PANELS[i]
          const fn = `atmosphere-triptych-${state.theme}-${panel.label}-${TRIPTYCH_PANEL_W}x${TRIPTYCH_PANEL_H}${suffix}.${fmt}`
          await exportTriptychPanel(fullSvg, panel.x, TRIPTYCH_TOTAL_W, TRIPTYCH_PANEL_W, TRIPTYCH_PANEL_H, fn, fmt, rasterScale)
        }
        setBatchProgress(null)
      } else {
        const svg = buildSvgString(state)
        const fn = `atmosphere-${state.theme}-${state.width}x${state.height}${suffix}.${fmt}`
        if (fmt === 'png') await exportPng(svg, state.width, state.height, fn, rasterScale)
        else if (fmt === 'webp') await exportWebp(svg, state.width, state.height, fn, rasterScale)
        else await exportJpg(svg, state.width, state.height, fn, rasterScale)
      }
    }
  }

  const handleBatchExport = async () => {
    const { width, height } = useStore.getState()
    const suffix = !isSvg && rasterScale === 2 ? '@2x' : ''
    let count = 0
    for (const theme of THEME_NAMES) {
      const state = stateForTheme(theme)
      if (isSvg) {
        if (isTriptych) {
          for (const panel of TRIPTYCH_PANELS) {
            count++; setBatchProgress(count)
            const svg = buildSvgString(state, { x: panel.x, w: TRIPTYCH_PANEL_W, h: TRIPTYCH_PANEL_H })
            exportSvg(svg, `atmosphere-triptych-${theme}-${panel.label}-${TRIPTYCH_PANEL_W}x${TRIPTYCH_PANEL_H}.svg`)
            await new Promise((r) => setTimeout(r, 80))
          }
        } else {
          count++; setBatchProgress(count)
          exportSvg(buildSvgString(state), `atmosphere-${theme}-${width}x${height}.svg`)
          await new Promise((r) => setTimeout(r, 80))
        }
      } else {
        const fmt = format as ImageFormat
        if (isTriptych) {
          const fullSvg = buildSvgString(state)
          for (const panel of TRIPTYCH_PANELS) {
            count++; setBatchProgress(count)
            const fn = `atmosphere-triptych-${theme}-${panel.label}-${TRIPTYCH_PANEL_W}x${TRIPTYCH_PANEL_H}${suffix}.${fmt}`
            await exportTriptychPanel(fullSvg, panel.x, TRIPTYCH_TOTAL_W, TRIPTYCH_PANEL_W, TRIPTYCH_PANEL_H, fn, fmt, rasterScale)
          }
        } else {
          count++; setBatchProgress(count)
          const svg = buildSvgString(state)
          const fn = `atmosphere-${theme}-${width}x${height}${suffix}.${fmt}`
          if (fmt === 'png') await exportPng(svg, width, height, fn, rasterScale)
          else if (fmt === 'webp') await exportWebp(svg, width, height, fn, rasterScale)
          else await exportJpg(svg, width, height, fn, rasterScale)
        }
      }
    }
    setBatchProgress(null)
    if (isSvg) setShowNoisePopup(true)
  }

  const copyNoise = () => {
    navigator.clipboard.writeText(FIGMA_NOISE_INSTRUCTIONS).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const batchLabel = isBusy
    ? `${batchProgress} of ${batchTotal}…`
    : isTriptych ? `Download all themes · ${batchTotal} files` : 'Download all themes'

  const ALL_FORMATS: ExportFormat[] = ['svg', 'png', 'webp', 'jpg']

  return (
    <>
      <div className="flex flex-col gap-8">
        {/* 1 — Format tiles with embedded size */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] uppercase tracking-widest text-white/30">Format</span>
          <div className="grid grid-cols-4 gap-2">
            {ALL_FORMATS.map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormat(fmt)}
                className={`flex flex-col items-start gap-2 p-3 rounded-xl transition-colors ${
                  format === fmt
                    ? 'bg-white/15 text-white'
                    : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/60'
                }`}
              >
                <span className="text-sm font-bold uppercase tracking-wide leading-none">{fmt}</span>
                <span className="text-[11px] font-mono leading-none">{sizes[fmt] ?? '—'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2 — Scale (raster only) */}
        {!isSvg && (
          <div className="flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-widest text-white/30">Scale</span>
            <SegmentedControl<'1' | '2'>
              options={[{ label: '1×', value: '1' }, { label: '2×', value: '2' }]}
              value={String(rasterScale) as '1' | '2'}
              onChange={(v) => setRasterScale(Number(v) as 1 | 2)}
            />
          </div>
        )}

        {/* 3 — Filename */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-widest text-white/30">File</span>
          <span className="text-xs font-mono text-white/25 break-all leading-relaxed">{filenamePreview}</span>
        </div>

        {/* 4 — Download */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleExport}
            disabled={isBusy}
            className="w-full py-5 px-6 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] transition-colors disabled:opacity-40 flex flex-col items-start gap-0.5"
          >
            <span className="text-2xl font-black uppercase tracking-tight text-white leading-none">
              {isBusy ? `${batchProgress} of ${isTriptych ? TRIPTYCH_PANELS.length : 1}…` : 'Download'}
            </span>
            <span className="text-xs text-white/40">
              {theme} theme{isTriptych ? ' · 3 panels' : ''}
            </span>
          </button>
          <button
            onClick={handleBatchExport}
            disabled={isBusy}
            className="w-full py-3 rounded-2xl text-xs text-white/35 bg-white/[0.03] hover:bg-white/[0.07] hover:text-white/60 transition-colors disabled:opacity-40"
          >
            {batchLabel}
          </button>
        </div>
      </div>

      {/* Figma noise tip — SVG exports only */}
      {showNoisePopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50" onClick={() => setShowNoisePopup(false)}>
          <div className="bg-neutral-900 border border-white/15 rounded-xl p-6 shadow-2xl w-80" onClick={(e) => e.stopPropagation()}>
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

function NumericInput({
  value,
  onChange,
  min,
  max,
  className = 'w-10 text-xs text-white/50',
  title,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  className?: string
  title?: string
}) {
  const [local, setLocal] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)
  const focusedRef = useRef(false)
  const scrubRef = useRef<{ x: number; startValue: number; scrubbing: boolean } | null>(null)

  useEffect(() => {
    if (!focusedRef.current) setLocal(String(value))
  }, [value])

  const commit = () => {
    focusedRef.current = false
    const n = parseInt(local, 10)
    if (!isNaN(n) && n >= min && n <= max) onChange(n)
    else setLocal(String(value))
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLInputElement>) => {
    if (focusedRef.current) return // already in edit mode — normal input behavior
    e.preventDefault()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    scrubRef.current = { x: e.clientX, startValue: value, scrubbing: false }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLInputElement>) => {
    if (!scrubRef.current) return
    const delta = e.clientX - scrubRef.current.x
    if (!scrubRef.current.scrubbing && Math.abs(delta) < 4) return
    scrubRef.current.scrubbing = true
    const speed = e.shiftKey ? 10 : 1
    onChange(Math.min(max, Math.max(min, Math.round(scrubRef.current.startValue + delta * speed))))
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLInputElement>) => {
    ;(e.target as Element).releasePointerCapture(e.pointerId)
    if (scrubRef.current && !scrubRef.current.scrubbing) {
      focusedRef.current = true
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    scrubRef.current = null
  }

  const handlePointerCancel = (e: React.PointerEvent<HTMLInputElement>) => {
    ;(e.target as Element).releasePointerCapture(e.pointerId)
    scrubRef.current = null
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={local}
      title={title}
      onChange={(e) => setLocal(e.target.value)}
      onFocus={() => { focusedRef.current = true }}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.blur()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={`bg-transparent text-center font-mono focus:outline-none transition-opacity cursor-ew-resize focus:cursor-text ${className}`}
    />
  )
}

function PresetDropdown() {
  const { width, height, triptych, setDimensions, setTriptych } = useStore((s) => ({
    width: s.width, height: s.height, triptych: s.triptych,
    setDimensions: s.setDimensions, setTriptych: s.setTriptych,
  }))
  const activePreset = !triptych && PRESETS.find((p) => p.width === width && p.height === height)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === 'triptych') {
      setTriptych(true)
    } else if (val !== '') {
      setTriptych(false)
      const [w, h] = val.split('x').map(Number)
      setDimensions(w, h)
    }
  }

  return (
    <select
      value={triptych ? 'triptych' : activePreset ? `${width}x${height}` : ''}
      onChange={handleChange}
      className="appearance-none bg-transparent text-xs text-white/50 hover:text-white/80
        outline-none cursor-pointer transition-colors px-1 py-0 text-center"
    >
      {!activePreset && !triptych && <option value="" className="bg-neutral-900">Preset</option>}
      {PRESETS.map((p) => (
        <option key={p.label} value={`${p.width}x${p.height}`} className="bg-neutral-900">
          {p.label}
        </option>
      ))}
      <option value="triptych" className="bg-neutral-900">Triptych (3 × 1080)</option>
    </select>
  )
}

function LogoToggle() {
  const showLogo = useStore((s) => s.showLogo)
  const toggleLogo = useStore((s) => s.toggleLogo)

  return (
    <button
      onClick={toggleLogo}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
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
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
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
      className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all bg-white/[0.10] ${
        isActive
          ? 'bg-white/[0.18] ring-1 ring-white/25'
          : 'hover:bg-white/[0.15]'
      }`}
      title={name}
    >
      <div className="flex -space-x-1">
        <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: theme.depth }} />
        <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: theme.main }} />
        <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: theme.highlight }} />
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
  const { width, height, triptych, noiseIntensity, theme } = useStore((s) => ({
    width: s.width, height: s.height, triptych: s.triptych, noiseIntensity: s.noiseIntensity, theme: s.theme,
  }))
  const setDimensions = useStore((s) => s.setDimensions)
  const setNoiseIntensity = useStore((s) => s.setNoiseIntensity)
  const [isResizing, setIsResizing] = useState(false)
  const prevNoiseRef = useRef(noiseIntensity > 0 ? noiseIntensity : 1)
  const wScrub = useScrub(width, (w) => setDimensions(w, height), 100, 4000)
  const hScrub = useScrub(height, (h) => setDimensions(width, h), 100, 4000)
  const { containerRef, scale, setScale, resetToFit, isManualScale, displayWidth, displayHeight } = useCanvasFit(width, height)
  const { handleMouseDown } = useCanvasResize(scale, setIsResizing)
  const zoomPct = Math.round(scale * 100)

  const noiseOn = noiseIntensity > 0
  const toggleNoise = () => {
    if (noiseOn) {
      prevNoiseRef.current = noiseIntensity
      setNoiseIntensity(0)
    } else {
      setNoiseIntensity(prevNoiseRef.current)
    }
  }

  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    if (!exportOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setExportOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [exportOpen])

  const zoomControls = (
    <div className="absolute right-0 flex items-center gap-0.5">
      <NumericInput value={zoomPct} onChange={(v) => setScale(v / 100)} min={5} max={200} className="w-6 text-xs text-white/30" title="Zoom %" />
      <span className="text-xs text-white/20">%</span>
      {isManualScale && (
        <button onClick={resetToFit} className="ml-1 text-[10px] text-white/25 hover:text-white/50 transition-colors">fit</button>
      )}
    </div>
  )

  return (
    <div className="flex-1 relative flex flex-col min-h-0 bg-neutral-950">
      {/* Download modal */}
      {exportOpen && (
        <div
          className="absolute inset-0 z-30 bg-black/75 overflow-y-auto"
          onClick={() => setExportOpen(false)}
        >
          <div className="min-h-full flex items-start justify-center pt-14 px-8 pb-14">
            <div
              className="w-full max-w-[540px] bg-neutral-900"
              style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.07)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-end justify-between px-10 pt-10 pb-8 border-b border-white/[0.06]">
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-[52px] font-black uppercase tracking-tighter text-white leading-none">
                    Download
                  </h2>
                  <span className="text-sm text-white/30 capitalize font-mono">
                    {theme} &middot; {triptych ? `${TRIPTYCH_PANEL_W} × ${TRIPTYCH_PANEL_H} per panel` : `${width} × ${height}`}
                  </span>
                </div>
                <button
                  onClick={() => setExportOpen(false)}
                  className="text-white/20 hover:text-white transition-colors text-[10px] uppercase tracking-widest mb-1.5"
                >
                  ESC
                </button>
              </div>
              <div className="px-10 py-9">
                <ExportPanel isTriptych={triptych} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas area with side columns */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center px-4 min-h-0 overflow-hidden">
        {/* Left column: Logo, Guides, Noise */}
        <div className="flex flex-col items-center gap-2 mr-6">
          <LogoToggle />
          <GuidesToggle />
          <button
            onClick={toggleNoise}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              noiseOn ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
            title={noiseOn ? 'Noise on — click to disable' : 'Noise off — click to enable'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 7h2m3 0h2m3 0h2m3 0h2M3 12h2m3 0h2m3 0h2m3 0h2M3 17h2m3 0h2m3 0h2m3 0h2" strokeLinecap="round"/>
            </svg>
            <span className="text-[10px] uppercase tracking-wide">Noise</span>
          </button>
        </div>

        {/* Center column: dimensions above, canvas, themes below */}
        <div className="flex flex-col items-center">
          {/* Dimensions - above canvas */}
          <div className="mb-4 flex flex-col items-center gap-1.5">
            {triptych ? (
              <>
                {/* Triptych: static display with per-panel annotation */}
                <div className="flex items-end gap-3">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-white/20 select-none">W</span>
                    <span className="w-24 text-3xl font-light text-white/70 opacity-80 text-center font-mono">{TRIPTYCH_TOTAL_W}</span>
                  </div>
                  <span className="text-2xl text-white/15 pb-1">×</span>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-white/20 select-none">H</span>
                    <span className="w-24 text-3xl font-light text-white/70 opacity-80 text-center font-mono">{TRIPTYCH_PANEL_H}</span>
                  </div>
                </div>
                <span className="text-[10px] text-white/25 -mt-0.5">1080 per panel</span>
                <div className="relative flex items-center justify-center" style={{ width: displayWidth }}>
                  <PresetDropdown />
                  {zoomControls}
                </div>
              </>
            ) : (
              <>
                {/* Standard: interactive scrub inputs */}
                <div className="flex items-end gap-3">
                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className="text-[9px] uppercase tracking-widest text-white/20 cursor-ew-resize select-none hover:text-white/40 transition-colors"
                      title="Drag to resize · Shift for ×10"
                      {...wScrub}
                    >
                      W
                    </span>
                    <NumericInput
                      value={width}
                      onChange={(w) => setDimensions(w, height)}
                      min={100} max={4000}
                      className="w-24 text-3xl font-light text-white/70 opacity-80"
                      title="Width"
                    />
                  </div>
                  <span className="text-2xl text-white/15 pb-1">×</span>
                  <div className="flex flex-col items-center gap-0.5">
                    <span
                      className="text-[9px] uppercase tracking-widest text-white/20 cursor-ew-resize select-none hover:text-white/40 transition-colors"
                      title="Drag to resize · Shift for ×10"
                      {...hScrub}
                    >
                      H
                    </span>
                    <NumericInput
                      value={height}
                      onChange={(h) => setDimensions(width, h)}
                      min={100} max={4000}
                      className="w-24 text-3xl font-light text-white/70 opacity-80"
                      title="Height"
                    />
                  </div>
                </div>
                <div className="relative flex items-center justify-center" style={{ width: displayWidth }}>
                  <PresetDropdown />
                  {zoomControls}
                </div>
              </>
            )}
          </div>

          {/* Canvas */}
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

            {!triptych && (
              <div className={`transition-opacity ${isResizing ? 'opacity-100' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'}`}>
                <ResizeHandle position="n" onMouseDown={handleMouseDown('n')} />
                <ResizeHandle position="s" onMouseDown={handleMouseDown('s')} />
                <ResizeHandle position="e" onMouseDown={handleMouseDown('e')} />
                <ResizeHandle position="w" onMouseDown={handleMouseDown('w')} />
                <ResizeHandle position="ne" onMouseDown={handleMouseDown('ne')} />
                <ResizeHandle position="nw" onMouseDown={handleMouseDown('nw')} />
                <ResizeHandle position="se" onMouseDown={handleMouseDown('se')} />
                <ResizeHandle position="sw" onMouseDown={handleMouseDown('sw')} />
              </div>
            )}
          </div>

          {/* Themes - below canvas */}
          <div className="mt-3 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1">
              {THEME_NAMES.map((name) => (
                <ThemeSwatch key={name} name={name} />
              ))}
            </div>
            <BackgroundToggle />
          </div>
        </div>

        {/* Right column: Export */}
        <div className="flex flex-col items-center gap-2 ml-6">
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              exportOpen ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
            title="Toggle export"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 3v13M8 12l4 4 4-4M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[10px] uppercase tracking-wide">Download</span>
          </button>
        </div>
      </div>
    </div>
  )
}
