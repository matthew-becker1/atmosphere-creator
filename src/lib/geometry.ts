export function computeRadius(w: number, h: number): number {
  return Math.sqrt(w * w + h * h) * 0.45
}

export function computeDefaultBlur(w: number, h: number): number {
  return computeRadius(w, h) * 0.4
}

export const DEFAULT_NOISE = 1

export interface ToleranceBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export function computeToleranceBounds(
  anchorX: number,
  anchorY: number,
  w: number,
  h: number
): ToleranceBounds {
  const col = Math.min(2, Math.floor(anchorX * 3))
  const row = Math.min(2, Math.floor(anchorY * 3))
  return {
    minX: (col / 3) * w,
    maxX: ((col + 1) / 3) * w,
    minY: (row / 3) * h,
    maxY: ((row + 1) / 3) * h,
  }
}

export function clampToTolerance(
  x: number,
  y: number,
  bounds: ToleranceBounds
): { x: number; y: number } {
  return {
    x: Math.min(Math.max(x, bounds.minX), bounds.maxX),
    y: Math.min(Math.max(y, bounds.minY), bounds.maxY),
  }
}
