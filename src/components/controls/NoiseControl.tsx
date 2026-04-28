import { useStore } from '../../store/useStore'

export function NoiseControl() {
  const noiseIntensity = useStore((s) => s.noiseIntensity)
  const setNoiseIntensity = useStore((s) => s.setNoiseIntensity)
  const on = noiseIntensity > 0

  return (
    <button
      onClick={() => setNoiseIntensity(on ? 0 : 1)}
      className={`w-full px-3 py-2 rounded text-sm transition-colors ${
        on
          ? 'bg-white/15 text-white border border-white/20'
          : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
      }`}
    >
      {on ? '◉ Noise on' : '○ Noise off'}
    </button>
  )
}
