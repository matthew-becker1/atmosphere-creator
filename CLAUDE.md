# Atmosphere Creator

A gradient atmosphere generator built for OUTFRONT Media. Produces SVG/PNG/WebP/JPG exports across multiple canvas formats.

## Stack

- React 18 + TypeScript + Vite + Tailwind CSS 3
- Zustand for state management
- No backend — fully client-side, deployed on Vercel via GitHub push to `main`
- GitHub: https://github.com/matthew-becker1/atmosphere-creator

## What it does

Three colored circles (depth, main, highlight) with feGaussianBlur create a gradient atmosphere. The user drags circles, scrubs between 4 themes (twilight/dawn/morning/day), adjusts noise, and exports.

## Canvas formats

- **Standard** — any size up to 4000×4000, resizable by drag
- **Triptych** — 3 panels × 1080px wide, shared gradient, cropped on export
- **Livecard MAX** — 5 coves (1920×360 each, 62px gaps, 9848px total) + 2 squares (1920×1920). Coves share one stretched gradient; squares use same anchor positions independently. Logo centered in each panel.

## Key files

- `src/constants/themes.ts` — 4 theme color sets + anchor positions
- `src/constants/triptych.ts` — triptych panel dimensions
- `src/constants/livecard.ts` — livecard MAX dimensions and panel arrays
- `src/store/useStore.ts` — all app state via Zustand
- `src/lib/geometry.ts` — radius/blur/noise math, `lerpColor`, `hexToRgb`
- `src/lib/svgBuilder.ts` — builds SVG strings for export; `buildLivecardSquareSvg` for squares
- `src/lib/exportPng.ts` — raster export helpers; `exportTriptychPanel` handles canvas cropping
- `src/components/preview/AtmosphereSvg.tsx` — live SVG preview
- `src/components/preview/PreviewArea.tsx` — all UI: scrubber, controls, export panel, resize handles

## Conventions

- App background color is `#1d0029` everywhere (body, App.tsx, triptych/livecard gap bars)
- Guide overlay color is `#ff2040` (red), strokes straddle canvas edge via SVG overflow:visible
- Drag handles: semi-transparent fill (opacity 0.45), white stroke, pointer capture API
- Theme scrubber: gooey SVG filter (feGaussianBlur + feColorMatrix alpha threshold), directional teardrop deform, snaps to integer stop on release
- No comments unless the why is non-obvious
- No extra abstractions — keep it direct

## Noise

Noise is toggled inside the export panel (not on the canvas). SVG exports show a Figma tip for applying noise manually. PNG/WebP/JPG bake noise in via `mix-blend-mode: soft-light`.

## Export filenames

- Standard: `atmosphere-{theme}-{W}x{H}.{ext}`
- Triptych: `atmosphere-triptych-{theme}-{panel}-{W}x{H}.{ext}`
- Livecard coves: `atmosphere-livecard-{theme}-cove-{001-005}-1920x360.{ext}`
- Livecard squares: `atmosphere-livecard-{theme}-square-{001-002}-1920x1920.{ext}`

## Owner

Matthew Becker — matthew@beckerdesign.us / github: matthew-becker1
