export type ThemeName = 'twilight' | 'dawn' | 'morning' | 'day'
export type CircleRole = 'depth' | 'main' | 'highlight'

export interface CircleState {
  role: CircleRole
  color: string
  anchorX: number
  anchorY: number
  x: number
  y: number
}

export interface AppState {
  theme: ThemeName
  themePosition: number
  width: number
  height: number
  triptych: boolean
  showGuides: boolean
  draggingRole: CircleRole | null
  noiseIntensity: number
  noiseScale: number
  darkBackground: boolean
  showLogo: boolean
  layerOrder: [CircleRole, CircleRole, CircleRole]
  circles: [CircleState, CircleState, CircleState]
}

export interface CanvasPreset {
  label: string
  width: number
  height: number
}
