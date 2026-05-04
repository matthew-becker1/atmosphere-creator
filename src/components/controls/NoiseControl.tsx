import { useStore } from '../../store/useStore'
import { DEFAULT_NOISE, DEFAULT_NOISE_SCALE } from '../../lib/geometry'

export function NoiseControl() {
  const noiseIntensity = useStore((s) => s.noiseIntensity)
  const noiseScale = useStore((s) => s.noiseScale)
  const setNoiseIntensity = useStore((s) => s.setNoiseIntensity)
  const setNoiseScale = useStore((s) => s.setNoiseScale)
  const on = noiseIntensity > 0

  const isDefault = noiseIntensity === DEFAULT_NOISE && noiseScale === DEFAULT_NOISE_SCALE

  const resetNoise = () => {
    setNoiseIntensity(DEFAULT_NOISE)
    setNoiseScale(DEFAULT_NOISE_SCALE)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs uppercase tracking-widest text-white/40">Noise</label>
        {!isDefault && on && (
          <button
            onClick={resetNoise}
            className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
          >
            Reset
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setNoiseIntensity(on ? 0 : DEFAULT_NOISE)}
          className={`w-full px-3 py-2 rounded text-sm transition-colors ${
            on
              ? 'bg-white/15 text-white border border-white/20'
              : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
          }`}
        >
          {on ? '◉ Noise on' : '○ Noise off'}
        </button>

        {on && (
          <div className="px-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/40">Grain size</span>
              <span className="text-xs text-white/60 font-mono">{noiseScale.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={noiseScale}
              onChange={(e) => setNoiseScale(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white/80
                [&::-webkit-slider-thumb]:hover:bg-white
                [&::-webkit-slider-thumb]:transition-colors"
            />
            <div className="flex justify-between text-[10px] text-white/25 mt-0.5">
              <span>Fine</span>
              <span>Coarse</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
