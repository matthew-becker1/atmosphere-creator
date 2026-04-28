import type { AppState } from '../types'
import { computeRadius, computeDefaultBlur } from './geometry'

function filterAttrs(blur: number, radius: number): string {
  const pad = Math.ceil((blur * 4 / Math.max(radius, 1)) * 100) + 60
  return `x="-${pad}%" y="-${pad}%" width="${200 + pad * 2}%" height="${200 + pad * 2}%"`
}

export function buildSvgString(state: AppState, forExport = false): string {
  const { width: W, height: H, circles, layerOrder, theme, noiseIntensity, darkBackground } = state
  const bgColor = darkBackground ? '#000000' : '#ffffff'
  const orderedCircles = layerOrder.map((role) => circles.find((c) => c.role === role)!)
  const radius = computeRadius(W, H)
  const blur = computeDefaultBlur(W, H)

  const xml = forExport ? '<?xml version="1.0" encoding="UTF-8"?>\n' : ''
  const xmlns = forExport ? ' xmlns:xlink="http://www.w3.org/1999/xlink"' : ''
  const comment = forExport
    ? `\n  <!--
    Atmosphere Creator
    Theme: ${theme}
    Canvas: ${W}×${H}
    Noise: ${noiseIntensity > 0 ? 'on' : 'off'}
    Generated: ${new Date().toISOString().split('T')[0]}
  -->`
    : ''

  const noiseLayer = noiseIntensity > 0
    ? `
  <!-- Noise overlay -->
  <rect width="${W}" height="${H}" fill="transparent" filter="url(#noise-filter)" opacity="${noiseIntensity.toFixed(3)}" style="mix-blend-mode: soft-light"/>`
    : ''

  return `${xml}<svg xmlns="http://www.w3.org/2000/svg"${xmlns} width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${comment}
  <defs>
    <filter id="blur-depth" ${filterAttrs(blur, radius)}>
      <feGaussianBlur in="SourceGraphic" stdDeviation="${blur.toFixed(1)}"/>
    </filter>
    <filter id="blur-main" ${filterAttrs(blur, radius)}>
      <feGaussianBlur in="SourceGraphic" stdDeviation="${blur.toFixed(1)}"/>
    </filter>
    <filter id="blur-highlight" ${filterAttrs(blur, radius)}>
      <feGaussianBlur in="SourceGraphic" stdDeviation="${blur.toFixed(1)}"/>
    </filter>
    <filter id="noise-filter" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" result="noise"/>
      <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
      <feComponentTransfer in="grayNoise" result="scaledNoise">
        <feFuncR type="linear" slope="1" intercept="0"/>
        <feFuncG type="linear" slope="1" intercept="0"/>
        <feFuncB type="linear" slope="1" intercept="0"/>
      </feComponentTransfer>
    </filter>
  </defs>
  <rect id="background" width="${W}" height="${H}" fill="${bgColor}"/>
  ${orderedCircles.map((c) =>
    `<!-- ${c.role}: ${c.color} -->\n  <circle id="circle-${c.role}" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${radius.toFixed(1)}" fill="${c.color}" filter="url(#blur-${c.role})"/>`
  ).join('\n  ')}${noiseLayer}
</svg>`
}
