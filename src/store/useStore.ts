import { create } from 'zustand'
import type { AppState, ThemeName, CircleRole, CircleState } from '../types'
import { THEMES, DEFAULT_ANCHORS } from '../constants/themes'
import { computeToleranceBounds, clampToTolerance, DEFAULT_NOISE } from '../lib/geometry'

const DEFAULT_LAYER_ORDER: AppState['layerOrder'] = ['depth', 'main', 'highlight']

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
  setDimensions: (w: number, h: number) => void
  setCirclePosition: (role: CircleRole, x: number, y: number) => void
  setNoiseIntensity: (value: number) => void
  moveLayer: (role: CircleRole, direction: 'up' | 'down') => void
  resetCircle: (role: CircleRole) => void
  resetAll: () => void
  toggleGuides: () => void
  setDraggingRole: (role: CircleRole | null) => void
  toggleBackground: () => void
}

const DEFAULT_WIDTH = 1080
const DEFAULT_HEIGHT = 1920

export const useStore = create<Store>((set, get) => ({
  theme: 'twilight',
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
  showGuides: false,
  draggingRole: null,
  darkBackground: true,
  noiseIntensity: DEFAULT_NOISE,
  layerOrder: DEFAULT_LAYER_ORDER,
  circles: makeCircles('twilight', DEFAULT_WIDTH, DEFAULT_HEIGHT),

  setTheme: (theme) =>
    set((s) => ({
      theme,
      circles: s.circles.map((c) => ({
        ...c,
        color: THEMES[theme][c.role],
      })) as AppState['circles'],
    })),

  setDimensions: (w, h) =>
    set(() => ({
      width: w,
      height: h,
      circles: makeCircles(get().theme, w, h),
    })),

  setCirclePosition: (role, x, y) =>
    set((s) => {
      const idx = s.circles.findIndex((c) => c.role === role)
      const circle = s.circles[idx]
      const bounds = computeToleranceBounds(circle.anchorX, circle.anchorY, s.width, s.height)
      const clamped = clampToTolerance(x, y, bounds)
      const updated = [...s.circles] as AppState['circles']
      updated[idx] = { ...circle, x: clamped.x, y: clamped.y }
      return { circles: updated }
    }),

  setNoiseIntensity: (value) => set({ noiseIntensity: Math.min(1, Math.max(0, value)) }),

  moveLayer: (role, direction) =>
    set((s) => {
      const order = [...s.layerOrder] as AppState['layerOrder']
      const idx = order.indexOf(role)
      const swapIdx = direction === 'up' ? idx + 1 : idx - 1
      if (swapIdx < 0 || swapIdx > 2) return {}
      ;[order[idx], order[swapIdx]] = [order[swapIdx], order[idx]]
      return { layerOrder: order }
    }),

  resetCircle: (role) =>
    set((s) => {
      const idx = s.circles.findIndex((c) => c.role === role)
      const anchor = DEFAULT_ANCHORS[role]
      const updated = [...s.circles] as AppState['circles']
      updated[idx] = {
        ...s.circles[idx],
        x: anchor.x * s.width,
        y: anchor.y * s.height,
      }
      return { circles: updated }
    }),

  resetAll: () =>
    set((s) => ({
      circles: makeCircles(s.theme, s.width, s.height),
      noiseIntensity: DEFAULT_NOISE,
      layerOrder: DEFAULT_LAYER_ORDER,
    })),

  toggleGuides: () => set((s) => ({ showGuides: !s.showGuides })),
  setDraggingRole: (role) => set({ draggingRole: role }),
  toggleBackground: () => set((s) => ({ darkBackground: !s.darkBackground })),
}))
