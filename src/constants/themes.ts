import type { ThemeName } from '../types'

export const THEMES: Record<ThemeName, { depth: string; main: string; highlight: string }> = {
  twilight: { depth: '#1D0029', main: '#64008F', highlight: '#816FFC' },
  dawn:     { depth: '#64008F', main: '#816FFC', highlight: '#2D66FF' },
  morning:  { depth: '#816FFC', main: '#2D66FF', highlight: '#A2EFFF' },
  day:      { depth: '#2D66FF', main: '#A2EFFF', highlight: '#FFAE6B' },
}

export const THEME_NAMES: ThemeName[] = ['twilight', 'dawn', 'morning', 'day']

export const DEFAULT_ANCHORS = {
  depth:     { x: 0,   y: 1   },
  main:      { x: 0.5, y: 0.5 },
  highlight: { x: 1,   y: 0   },
} as const
