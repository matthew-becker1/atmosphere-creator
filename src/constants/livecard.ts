export const LIVECARD_COVE_W = 1920
export const LIVECARD_COVE_H = 360
export const LIVECARD_COVE_GAP = 62
export const LIVECARD_COVE_COUNT = 5
export const LIVECARD_TOTAL_W = LIVECARD_COVE_W * LIVECARD_COVE_COUNT + LIVECARD_COVE_GAP * (LIVECARD_COVE_COUNT - 1) // 9848
export const LIVECARD_SQUARE_SIZE = 1920
export const LIVECARD_SQUARE_COUNT = 2

export const LIVECARD_COVES = Array.from({ length: LIVECARD_COVE_COUNT }, (_, i) => ({
  label: String(i + 1).padStart(3, '0'),
  x: i * (LIVECARD_COVE_W + LIVECARD_COVE_GAP),
}))

export const LIVECARD_SQUARES = [
  { label: 'square-001' },
  { label: 'square-002' },
]
