import { useStore } from '../../store/useStore'

export function GuideToggle() {
  const showGuides = useStore((s) => s.showGuides)
  const toggleGuides = useStore((s) => s.toggleGuides)

  return (
    <button
      onClick={toggleGuides}
      className={`w-full px-3 py-2 rounded text-sm transition-colors ${
        showGuides
          ? 'bg-white/15 text-white border border-white/20'
          : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
      }`}
    >
      {showGuides ? '◉ Guides on' : '○ Guides off'}
    </button>
  )
}
