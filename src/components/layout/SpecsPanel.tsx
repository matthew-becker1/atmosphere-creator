import { useState } from 'react'
import { useStore } from '../../store/useStore'

export function SpecsPanel() {
  const { theme, width, height, circles, noiseIntensity } = useStore()
  const [copied, setCopied] = useState(false)

  const specs = [
    `Canvas: ${width} × ${height}px`,
    `Theme: ${theme}`,
    `Noise: ${noiseIntensity > 0 ? 'on' : 'off'}`,
    '',
    ...circles.map(
      (c) => `${c.role}: ${c.color}  x=${Math.round(c.x)}  y=${Math.round(c.y)}`
    ),
  ].join('\n')

  const copy = () => {
    navigator.clipboard.writeText(specs).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="border-t border-white/10 p-4 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-widest text-white/35">Specs</span>
        <button onClick={copy} className="text-xs text-white/35 hover:text-white/70 transition-colors">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="text-xs text-white/45 leading-relaxed whitespace-pre font-mono">{specs}</pre>
    </div>
  )
}
