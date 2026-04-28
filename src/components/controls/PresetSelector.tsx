import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { PRESETS } from '../../constants/presets'

export function PresetSelector() {
  const { width, height, setDimensions } = useStore()
  const [customW, setCustomW] = useState(String(width))
  const [customH, setCustomH] = useState(String(height))

  const activePreset = PRESETS.find((p) => p.width === width && p.height === height)

  const handlePreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const [w, h] = val.split('x').map(Number)
    setCustomW(String(w))
    setCustomH(String(h))
    setDimensions(w, h)
  }

  const handleCustomApply = () => {
    const w = Math.max(1, parseInt(customW) || width)
    const h = Math.max(1, parseInt(customH) || height)
    setDimensions(w, h)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCustomApply()
  }

  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Canvas Size</label>
      <select
        value={activePreset ? `${width}x${height}` : ''}
        onChange={handlePreset}
        className="w-full bg-white/10 text-white text-sm rounded px-2 py-1.5 outline-none cursor-pointer mb-2"
      >
        {!activePreset && <option value="" className="bg-neutral-900">Custom</option>}
        {PRESETS.map((p) => (
          <option key={p.label} value={`${p.width}x${p.height}`} className="bg-neutral-900">
            {p.label}
          </option>
        ))}
      </select>

      <div className="flex gap-2 items-center">
        <input
          type="number" value={customW}
          onChange={(e) => setCustomW(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-white/10 rounded px-2 py-1 text-sm text-white outline-none"
          placeholder="W"
        />
        <span className="text-white/30 text-sm flex-shrink-0">×</span>
        <input
          type="number" value={customH}
          onChange={(e) => setCustomH(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-white/10 rounded px-2 py-1 text-sm text-white outline-none"
          placeholder="H"
        />
        <button
          onClick={handleCustomApply}
          className="px-3 py-1 bg-white/20 rounded text-sm text-white hover:bg-white/30 transition-colors flex-shrink-0"
        >
          Apply
        </button>
      </div>
    </div>
  )
}
