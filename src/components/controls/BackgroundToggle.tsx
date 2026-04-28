import { useStore } from '../../store/useStore'

export function BackgroundToggle() {
  const darkBackground = useStore((s) => s.darkBackground)
  const toggleBackground = useStore((s) => s.toggleBackground)

  return (
    <div className="flex gap-1.5 w-full">
      <button
        onClick={() => !darkBackground && toggleBackground()}
        className={`flex-1 py-3 rounded text-sm font-medium transition-colors ${
          darkBackground
            ? 'bg-white/20 text-white'
            : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70'
        }`}
      >
        Black
      </button>
      <button
        onClick={() => darkBackground && toggleBackground()}
        className={`flex-1 py-3 rounded text-sm font-medium transition-colors ${
          !darkBackground
            ? 'bg-white/20 text-white'
            : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70'
        }`}
      >
        White
      </button>
    </div>
  )
}
