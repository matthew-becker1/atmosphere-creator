import { useStore } from '../../store/useStore'
import type { CircleRole } from '../../types'
import { THEMES } from '../../constants/themes'

const ROLE_LABELS: Record<CircleRole, string> = {
  depth: 'Depth',
  main: 'Main',
  highlight: 'Highlight',
}

export function LayerOrder() {
  const layerOrder = useStore((s) => s.layerOrder)
  const moveLayer = useStore((s) => s.moveLayer)
  const theme = useStore((s) => s.theme)
  const colors = THEMES[theme]

  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Layer Order</label>
      <div className="flex flex-col gap-1">
        {[...layerOrder].reverse().map((role) => {
          const idx = layerOrder.indexOf(role)
          const isTop = idx === layerOrder.length - 1
          const isBottom = idx === 0
          return (
            <div key={role} className="flex items-center gap-2 px-2 py-1.5 rounded bg-white/5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-white/10" style={{ background: colors[role] }} />
              <span className="text-xs text-white/60 flex-1">{ROLE_LABELS[role]}</span>
              <div className="flex gap-0.5">
                <button
                  onClick={() => moveLayer(role, 'up')}
                  disabled={isTop}
                  className="px-1.5 py-0.5 text-xs text-white/40 hover:text-white/80 disabled:opacity-20 disabled:cursor-default transition-colors"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveLayer(role, 'down')}
                  disabled={isBottom}
                  className="px-1.5 py-0.5 text-xs text-white/40 hover:text-white/80 disabled:opacity-20 disabled:cursor-default transition-colors"
                  title="Move down"
                >
                  ↓
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-white/20 mt-1.5">Top = renders last (front)</p>
    </div>
  )
}
