import { useStore } from '../../store/useStore'
import { THEMES } from '../../constants/themes'
import type { ThemeName } from '../../types'

const THEME_NAMES: ThemeName[] = ['twilight', 'dawn', 'morning', 'day']

export function ThemeSelector() {
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)

  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Theme</label>
      <div className="flex flex-col gap-1.5">
        {THEME_NAMES.map((t) => {
          const colors = THEMES[t]
          const active = theme === t
          return (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-3 py-2 rounded text-sm capitalize transition-colors text-left ${
                active
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              <span className="flex items-center justify-between w-full">
                <span className="capitalize">{t}</span>
                <span className="flex gap-1">
                  <span className="w-3 h-3 rounded-full border border-white/10 flex-shrink-0" style={{ background: colors.depth }} title={`Depth ${colors.depth}`} />
                  <span className="w-3 h-3 rounded-full border border-white/10 flex-shrink-0" style={{ background: colors.main }} title={`Main ${colors.main}`} />
                  <span className="w-3 h-3 rounded-full border border-white/10 flex-shrink-0" style={{ background: colors.highlight }} title={`Highlight ${colors.highlight}`} />
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
