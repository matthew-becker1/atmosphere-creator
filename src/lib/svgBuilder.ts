import type { AppState } from '../types'
import { computeRadius, computeDefaultBlur, computeFilterPadding, computeNoiseFrequency } from './geometry'
import { TRIPTYCH_PANEL_W, TRIPTYCH_GAP } from '../constants/triptych'

const LOGO_PATH = "M805.6304,125.2814h-29.1546v72.3543h-22.926v-72.3543h-24.8545v72.3543h-23.1482l-39.2007-56.6611v56.6611h-23.1706v-95.2757h23.175l39.1962,54.7615v-54.7615h110.1675l-10.0843,22.9214ZM639.6124,150.0035c0,27.5693-22.6518,49.9943-50.4996,49.9943s-50.5042-22.425-50.5042-49.9943,22.6587-50.0057,50.5042-50.0057,50.4996,22.4317,50.4996,50.0057ZM616.2196,150.0035c0-14.8064-12.1545-26.8465-27.1068-26.8465s-27.1248,12.0401-27.1248,26.8465,12.1679,26.8419,27.1248,26.8419,27.1068-12.0401,27.1068-26.8419ZM516.5854,163.6086l23.5142,34.0293h-27.1203l-20.6241-30.4906h-12.2758v30.4906h-23.1617v-72.3611h-54.3326v18.9693h44.5561l-9.9047,22.9102h-34.6873v30.4816h-23.1482v-93.9846l-9.1502,21.6235h-33.3535v72.3611h-23.1661v-72.3611h-23.6892v30.8433c0,28.8626-16.3602,43.0134-42.2006,43.0134s-41.6685-14.2967-41.6685-42.3331v-54.4449h23.2043v54.0385c0,14.0047,7.0686,21.2462,18.7313,21.2462s18.7336-6.9967,18.7336-20.6264v-54.6582h234.0678c12.2355,0,21.7268,3.4019,28.0499,9.6644,5.3643,5.3082,8.252,12.7899,8.252,21.7784v.2739c0,15.3812-8.389,25.0412-20.6266,29.5365ZM514.1357,135.4846c0-7.3763-4.9264-11.1733-12.9516-11.1733h-21.1047v22.4543h21.4302c8.0298,0,12.6261-4.4685,12.6261-11.0611v-.2199ZM202.0168,149.9922c0,27.5695-22.652,50.0035-50.5042,50.0035s-50.5042-22.434-50.5042-50.0035,22.6564-49.9943,50.5042-49.9943,50.5042,22.4296,50.5042,49.9943ZM178.6283,149.9922c0-14.7974-12.1634-26.8328-27.1157-26.8328s-27.1113,12.0355-27.1113,26.8328,12.159,26.8419,27.1113,26.8419,27.1157-12.0399,27.1157-26.8419ZM833.6136,102.3581l-41.5045,95.2795h31.276l41.502-95.2795h-31.2735Z"
const LOGO_VIEWBOX_WIDTH = 965.8955
const LOGO_VIEWBOX_HEIGHT = 299.9957

export function buildSvgString(state: AppState, crop?: { x: number; w: number; h: number }): string {
  const { width: W, height: H, circles, layerOrder, theme, noiseIntensity, noiseScale, darkBackground, showLogo } = state
  const bgColor = darkBackground ? '#000000' : '#ffffff'
  const orderedCircles = layerOrder.map((role) => circles.find((c) => c.role === role)!)
  const radius = computeRadius(W, H)
  const blur = computeDefaultBlur(W, H)
  const pad = computeFilterPadding(blur, radius)
  const frequency = computeNoiseFrequency(W, H, noiseScale)
  const filterRegion = `x="-${pad}%" y="-${pad}%" width="${200 + pad * 2}%" height="${200 + pad * 2}%"`
  const outW = crop ? crop.w : W
  const outH = crop ? crop.h : H
  const viewBox = crop ? `${crop.x} 0 ${crop.w} ${crop.h}` : `0 0 ${W} ${H}`

  const noiseLayer = noiseIntensity > 0
    ? `\n  <rect width="${W}" height="${H}" fill="transparent" filter="url(#noise)" opacity="${noiseIntensity.toFixed(3)}" style="mix-blend-mode: soft-light"/>`
    : ''

  const logoLayer = showLogo
    ? (() => {
        const refW = state.triptych ? TRIPTYCH_PANEL_W : W
        const centerX = state.triptych ? TRIPTYCH_PANEL_W + TRIPTYCH_GAP + TRIPTYCH_PANEL_W / 2 : W / 2
        const logoWidth = refW * 0.5
        const logoScale = logoWidth / LOGO_VIEWBOX_WIDTH
        const logoHeight = LOGO_VIEWBOX_HEIGHT * logoScale
        const logoX = centerX - logoWidth / 2
        const logoY = (H - logoHeight) / 2
        return `\n  <g id="logo" transform="translate(${logoX.toFixed(1)}, ${logoY.toFixed(1)}) scale(${logoScale.toFixed(6)})">\n    <path d="${LOGO_PATH}" fill="#fafafc"/>\n  </g>`
      })()
    : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${outW}" height="${outH}" viewBox="${viewBox}">
  <!--
    Atmosphere Creator
    Theme: ${theme}
    Canvas: ${W}×${H}${crop ? `\n    Panel: x=${crop.x}, ${crop.w}×${crop.h}` : ''}
    Noise: ${noiseIntensity > 0 ? 'on' : 'off'}
    Generated: ${new Date().toISOString().split('T')[0]}
  -->
  <defs>
    <filter id="blur" ${filterRegion}>
      <feGaussianBlur in="SourceGraphic" stdDeviation="${blur.toFixed(1)}"/>
    </filter>
    <filter id="noise" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="${frequency.toFixed(4)}" numOctaves="4" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncR type="linear" slope="1" intercept="0"/>
        <feFuncG type="linear" slope="1" intercept="0"/>
        <feFuncB type="linear" slope="1" intercept="0"/>
      </feComponentTransfer>
    </filter>
  </defs>
  <rect id="background" width="${W}" height="${H}" fill="${bgColor}"/>
  ${orderedCircles.map((c) =>
    `<circle id="circle-${c.role}" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${radius.toFixed(1)}" fill="${c.color}" filter="url(#blur)"/>`
  ).join('\n  ')}${noiseLayer}${logoLayer}
</svg>`
}
