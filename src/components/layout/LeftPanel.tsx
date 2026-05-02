import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { GuideToggle } from '../controls/GuideToggle'
import { LayerOrder } from '../controls/LayerOrder'
import { NoiseControl } from '../controls/NoiseControl'
import { SpecsPanel } from './SpecsPanel'
import { buildSvgString } from '../../lib/svgBuilder'
import { exportSvg, exportPng, exportWebp, exportJpg } from '../../lib/exportPng'

const FIGMA_NOISE_INSTRUCTIONS = `To match noise in Figma:
1. Draw a rect over the full frame
2. Fill → + → Noise (not solid)
   Size: 200  Opacity: 8%
3. Set layer blend mode to Soft Light
4. Set layer opacity to 100%`

const ADVANCED_WARNING = `Layer order is part of the atmosphere system. The default stack — Depth → Main → Highlight — is intentional and produces on-brand results.

Changing it may create compositions that don't match the approved system.

Only proceed if you have a specific creative reason.`

type ExportFormat = 'png' | 'webp' | 'jpg'

export function LeftPanel() {
  const state = useStore()
  const [rasterScale, setRasterScale] = useState<1 | 2>(2)
  const [rasterFormat, setRasterFormat] = useState<ExportFormat>('png')
  const [showNoisePopup, setShowNoisePopup] = useState(false)
  const [showAdvancedConfirm, setShowAdvancedConfirm] = useState(false)
  const [advancedUnlocked, setAdvancedUnlocked] = useState(false)
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

  const handleAdvancedClick = () => {
    if (advancedUnlocked) {
      setAdvancedUnlocked(false)
      state.resetAll()
    } else {
      setShowAdvancedConfirm(true)
    }
  }

  return (
    <>
      <aside className="w-64 flex flex-col h-full bg-black border-r border-white/10 overflow-hidden flex-shrink-0">
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 min-h-0">
          <div>
            <h1 className="text-sm font-semibold text-white tracking-wide">Atmosphere</h1>
            <p className="text-xs text-white/30">Gradient Generator</p>
          </div>

          {advancedUnlocked && (
            <>
              <LayerOrder />
              <NoiseControl />
            </>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Logo Overlay</label>
            <button
              onClick={state.toggleLogo}
              className={`w-full px-3 py-2 rounded text-sm transition-colors ${
                state.showLogo
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              {state.showLogo ? 'Logo On' : 'Logo Off'}
            </button>
          </div>

          <GuideToggle />

          <button
            onClick={state.resetAll}
            className="w-full px-3 py-2 rounded text-sm bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors"
          >
            Reset all
          </button>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleSvgExport}
              className="w-full px-3 py-2.5 rounded text-sm bg-white/10 text-white hover:bg-white/20 transition-colors font-medium"
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
                    className={`px-2.5 py-2 text-xs transition-colors ${rasterScale === 1 ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                  >
                    1×
                  </button>
                  <button
                    onClick={() => setRasterScale(2)}
                    className={`px-2.5 py-2 text-xs transition-colors border-l border-white/10 ${rasterScale === 2 ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
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
                    className={`flex-1 px-2 py-1.5 text-xs transition-colors ${
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

          <button
            onClick={handleAdvancedClick}
            className={`w-full px-3 py-2 rounded text-xs transition-colors border ${
              advancedUnlocked
                ? 'border-amber-500/40 text-amber-400/70 bg-amber-500/5 hover:bg-amber-500/10'
                : 'border-white/10 text-white/25 hover:text-white/50 hover:border-white/20'
            }`}
          >
            {advancedUnlocked ? '⚠ Advanced mode on — click to exit' : 'Advanced'}
          </button>
        </div>

        <SpecsPanel />
      </aside>

      {showAdvancedConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={() => setShowAdvancedConfirm(false)}
        >
          <div
            className="bg-neutral-900 border border-amber-500/30 rounded-xl p-6 shadow-2xl w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm font-medium text-amber-400">Advanced Mode</span>
              <button onClick={() => setShowAdvancedConfirm(false)} className="text-white/40 hover:text-white leading-none ml-3">✕</button>
            </div>
            <p className="text-xs text-white/55 leading-relaxed whitespace-pre-wrap mb-5">{ADVANCED_WARNING}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAdvancedConfirm(false)}
                className="flex-1 px-3 py-2 rounded text-sm bg-white/5 text-white/50 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setAdvancedUnlocked(true); setShowAdvancedConfirm(false) }}
                className="flex-1 px-3 py-2 rounded text-sm bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

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
              <button onClick={() => setShowNoisePopup(false)} className="text-white/40 hover:text-white leading-none ml-3">✕</button>
            </div>
            <pre className="text-xs text-white/55 leading-relaxed whitespace-pre-wrap font-mono mb-4">{FIGMA_NOISE_INSTRUCTIONS}</pre>
            <button onClick={copyNoise} className="text-xs text-white/40 hover:text-white/70 transition-colors">
              {copied ? '✓ Copied' : 'Copy instructions'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
