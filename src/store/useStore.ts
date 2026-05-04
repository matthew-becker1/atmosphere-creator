import { create } from 'zustand'
import type { AppState, ThemeName, CircleRole, CircleState } from '../types'
import { THEMES, THEME_NAMES as THEMES_ARRAY, DEFAULT_ANCHORS } from '../constants/themes'
import { constrainCircle, DEFAULT_NOISE, DEFAULT_NOISE_SCALE, lerpColor } from '../lib/geometry'
import { TRIPTYCH_TOTAL_W, TRIPTYCH_PANEL_H } from '../constants/triptych'

const DEFAULT_LAYER_ORDER: AppState['layerOrder'] = ['highlight', 'main', 'depth']

function makeCircles(theme: ThemeName, w: number, h: number): AppState['circles'] {
  const colors = THEMES[theme]

  const makeCircle = (role: CircleRole): CircleState => {
    const anchor = DEFAULT_ANCHORS[role]
    return {
      role,
      color: colors[role],
      anchorX: anchor.x,
      anchorY: anchor.y,
      x: anchor.x * w,
      y: anchor.y * h,
    }
  }

  return [makeCircle('depth'), makeCircle('main'), makeCircle('highlight')]
}

interface Store extends AppState {
  setTheme: (theme: ThemeName) => void
  setThemePosition: (pos: number) => void
  setDimensions: (w: number, h: number) => void
  setTriptych: (v: boolean) => void
  setCirclePosition: (role: CircleRole, x: number, y: number) => void
  setCircleColor: (role: CircleRole, color: string) => void
  setNoiseIntensity: (value: number) => void
  setNoiseScale: (value: number) => void
  moveLayer: (role: CircleRole, direction: 'up' | 'down') => void
  resetAll: () => void
  toggleGuides: () => void
  setDraggingRole: (role: CircleRole | null) => void
  toggleBackground: () => void
  toggleLogo: () => void
}

const DEFAULT_WIDTH = 1080
const DEFAULT_HEIGHT = 1920

export const useStore = create<Store>((set, get) => ({
  theme: 'day',
  themePosition: 3,
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
  triptych: false,
  showGuides: false,
  draggingRole: null,
  darkBackground: true,
  showLogo: false,
  noiseIntensity: DEFAULT_NOISE,
  noiseScale: DEFAULT_NOISE_SCALE,
  layerOrder: DEFAULT_LAYER_ORDER,
  circles: makeCircles('day', DEFAULT_WIDTH, DEFAULT_HEIGHT),

  setTheme: (theme) =>
    set((s) => ({
      theme,
      themePosition: THEMES_ARRAY.indexOf(theme),
      circles: s.circles.map((c) => ({
        ...c,
        color: THEMES[theme][c.role],
      })) as AppState['circles'],
    })),

  setThemePosition: (pos) => {
    const clamped = Math.max(0, Math.min(THEMES_ARRAY.length - 1, pos))
    const lo = Math.min(Math.floor(clamped), THEMES_ARRAY.length - 2)
    const hi = lo + 1
    const t = clamped - lo
    const themeA = THEMES[THEMES_ARRAY[lo]]
    const themeB = THEMES[THEMES_ARRAY[hi]]
    const colors = {
      depth:     lerpColor(themeA.depth,     themeB.depth,     t),
      main:      lerpColor(themeA.main,      themeB.main,      t),
      highlight: lerpColor(themeA.highlight, themeB.highlight, t),
    }
    const nearest = THEMES_ARRAY[Math.round(clamped)]
    set((s) => ({
      themePosition: clamped,
      theme: nearest,
      circles: s.circles.map((c) => ({ ...c, color: colors[c.role] })) as AppState['circles'],
    }))
  },

  setDimensions: (w, h) =>
    set(() => ({
      width: w,
      height: h,
      triptych: false,
      circles: makeCircles(get().theme, w, h),
    })),

  setTriptych: (v) =>
    set((s) => v
      ? { triptych: true, width: TRIPTYCH_TOTAL_W, height: TRIPTYCH_PANEL_H, circles: makeCircles(s.theme, TRIPTYCH_TOTAL_W, TRIPTYCH_PANEL_H) }
      : { triptych: false }
    ),

  setCirclePosition: (role, x, y) =>
    set((s) => {
      const idx = s.circles.findIndex((c) => c.role === role)
      const circle = s.circles[idx]
      const clamped = constrainCircle(role, x, y, s.width, s.height)
      const updated = [...s.circles] as AppState['circles']
      updated[idx] = { ...circle, x: clamped.x, y: clamped.y }
      return { circles: updated }
    }),

  setCircleColor: (role, color) =>
    set((s) => {
      const idx = s.circles.findIndex((c) => c.role === role)
      const updated = [...s.circles] as AppState['circles']
      updated[idx] = { ...s.circles[idx], color }
      return { circles: updated }
    }),

  setNoiseIntensity: (value) => set({ noiseIntensity: Math.min(1, Math.max(0, value)) }),
  setNoiseScale: (value) => set({ noiseScale: Math.min(3, Math.max(0.1, value)) }),

  moveLayer: (role, direction) =>
    set((s) => {
      const order = [...s.layerOrder] as AppState['layerOrder']
      const idx = order.indexOf(role)
      const swapIdx = direction === 'up' ? idx + 1 : idx - 1
      if (swapIdx < 0 || swapIdx > 2) return {}
      ;[order[idx], order[swapIdx]] = [order[swapIdx], order[idx]]
      return { layerOrder: order }
    }),

  resetAll: () =>
    set((s) => ({
      circles: makeCircles(s.theme, s.width, s.height),
      noiseIntensity: DEFAULT_NOISE,
      noiseScale: DEFAULT_NOISE_SCALE,
      layerOrder: DEFAULT_LAYER_ORDER,
    })),

  toggleGuides: () => set((s) => ({ showGuides: !s.showGuides })),
  setDraggingRole: (role) => set({ draggingRole: role }),
  toggleBackground: () => set((s) => ({ darkBackground: !s.darkBackground })),
  toggleLogo: () => set((s) => ({ showLogo: !s.showLogo })),
}))
