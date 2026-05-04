export const TRIPTYCH_PANEL_W = 1080
export const TRIPTYCH_PANEL_H = 1920
export const TRIPTYCH_GAP = 221
export const TRIPTYCH_TOTAL_W = TRIPTYCH_PANEL_W * 3 + TRIPTYCH_GAP * 2  // 3682

export const TRIPTYCH_PANELS: readonly { label: string; x: number }[] = [
  { label: 'left',   x: 0 },
  { label: 'center', x: TRIPTYCH_PANEL_W + TRIPTYCH_GAP },
  { label: 'right',  x: (TRIPTYCH_PANEL_W + TRIPTYCH_GAP) * 2 },
]
