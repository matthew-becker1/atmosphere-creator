export function computeRadius(w: number, h: number): number {
  return Math.sqrt(w * w + h * h) * 0.45
}

export function computeDefaultBlur(w: number, h: number): number {
  return computeRadius(w, h) * 0.4
}

export function computeFilterPadding(blur: number, radius: number): number {
  return Math.ceil((blur * 4 / Math.max(radius, 1)) * 100) + 60
}

const NOISE_BASE_FREQUENCY = 0.65
const NOISE_REF_SIZE = Math.sqrt(1080 * 1920)
const NOISE_MAX_FREQUENCY = 1.5

export function computeNoiseFrequency(w: number, h: number, noiseScale: number): number {
  const raw = NOISE_BASE_FREQUENCY * noiseScale * (NOISE_REF_SIZE / Math.sqrt(w * h))
  return Math.min(raw, NOISE_MAX_FREQUENCY)
}

export const DEFAULT_NOISE = 1
export const DEFAULT_NOISE_SCALE = 1

export function constrainCircle(role: string, x: number, y: number, w: number, h: number): { x: number; y: number } {
  if (role === 'depth') {
    // L-shaped: left edge (x=0, y: h → 2h/3) or bottom edge (y=h, x: 0 → w/3)
    if (x <= h - y) {
      return { x: 0, y: Math.min(h, Math.max(2 * h / 3, y)) }
    }
    return { x: Math.min(w / 3, Math.max(0, x)), y: h }
  }
  if (role === 'highlight') {
    // L-shaped: right edge (x=w, y: 0 → h/3) or top edge (y=0, x: 2w/3 → w)
    if (w - x <= y) {
      return { x: w, y: Math.min(h / 3, Math.max(0, y)) }
    }
    return { x: Math.min(w, Math.max(2 * w / 3, x)), y: 0 }
  }
  // main: center 1/3 box
  return {
    x: Math.min(2 * w / 3, Math.max(w / 3, x)),
    y: Math.min(2 * h / 3, Math.max(h / 3, y)),
  }
}
