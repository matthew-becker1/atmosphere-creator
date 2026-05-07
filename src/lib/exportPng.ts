import { zipSync } from 'fflate'

export type ImageFormat = 'png' | 'webp' | 'jpg'

export function downloadZip(files: { name: string; data: Uint8Array }[], zipName: string): void {
  const entries: Record<string, Uint8Array> = {}
  for (const f of files) entries[f.name] = f.data
  const zipped = zipSync(entries)
  const blob = new Blob([zipped], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = zipName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function svgToImageBlob(
  svgString: string,
  width: number,
  height: number,
  format: ImageFormat,
  scale: 1 | 2,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas 2D context unavailable')); return }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const mime = format === 'jpg' ? 'image/jpeg' : `image/${format}`
      canvas.toBlob((b) => {
        if (b) resolve(b); else reject(new Error(`${format} export failed`))
      }, mime, quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG load failed')) }
    img.src = url
  })
}

async function cropSvgToImageBlob(
  svgString: string,
  panelX: number,
  totalWidth: number,
  panelWidth: number,
  panelHeight: number,
  format: ImageFormat,
  scale: 1 | 2,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const full = document.createElement('canvas')
      full.width = totalWidth * scale
      full.height = panelHeight * scale
      const fullCtx = full.getContext('2d')
      if (!fullCtx) { reject(new Error('Canvas 2D context unavailable')); return }
      fullCtx.drawImage(img, 0, 0, full.width, full.height)
      const panel = document.createElement('canvas')
      panel.width = panelWidth * scale
      panel.height = panelHeight * scale
      const panelCtx = panel.getContext('2d')
      if (!panelCtx) { reject(new Error('Canvas 2D context unavailable')); return }
      panelCtx.drawImage(full, panelX * scale, 0, panelWidth * scale, panelHeight * scale, 0, 0, panel.width, panel.height)
      const mime = format === 'jpg' ? 'image/jpeg' : `image/${format}`
      panel.toBlob((b) => {
        if (b) resolve(b); else reject(new Error(`${format} crop export failed`))
      }, mime, quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG load failed')) }
    img.src = url
  })
}

async function exportImage(
  svgString: string,
  width: number,
  height: number,
  filename: string,
  format: ImageFormat,
  scale: 1 | 2 = 2,
  quality: number = 0.92
): Promise<void> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas 2D context unavailable')); return }
      ctx.drawImage(img, 0, 0, width * scale, height * scale)
      URL.revokeObjectURL(url)

      const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`
      canvas.toBlob((imageBlob) => {
        if (!imageBlob) { reject(new Error(`${format.toUpperCase()} export failed`)); return }
        const a = document.createElement('a')
        a.href = URL.createObjectURL(imageBlob)
        a.download = filename
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 1000)
        resolve()
      }, mimeType, quality)
    }

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG load failed')) }
    img.src = url
  })
}

export async function exportPng(
  svgString: string,
  width: number,
  height: number,
  filename: string,
  scale: 1 | 2 = 2
): Promise<void> {
  return exportImage(svgString, width, height, filename, 'png', scale)
}

export async function exportWebp(
  svgString: string,
  width: number,
  height: number,
  filename: string,
  scale: 1 | 2 = 2,
  quality: number = 0.92
): Promise<void> {
  return exportImage(svgString, width, height, filename, 'webp', scale, quality)
}

export async function exportJpg(
  svgString: string,
  width: number,
  height: number,
  filename: string,
  scale: 1 | 2 = 2,
  quality: number = 0.92
): Promise<void> {
  return exportImage(svgString, width, height, filename, 'jpg', scale, quality)
}

export function svgFileEntry(svgString: string, filename: string): { name: string; data: Uint8Array } {
  return { name: filename, data: new TextEncoder().encode(svgString) }
}

export async function imageFileEntry(
  svgString: string,
  width: number,
  height: number,
  filename: string,
  format: ImageFormat,
  scale: 1 | 2 = 1,
  quality: number = 0.92
): Promise<{ name: string; data: Uint8Array }> {
  const blob = await svgToImageBlob(svgString, width, height, format, scale, quality)
  return { name: filename, data: new Uint8Array(await blob.arrayBuffer()) }
}

export async function cropImageFileEntry(
  svgString: string,
  panelX: number,
  totalWidth: number,
  panelWidth: number,
  panelHeight: number,
  filename: string,
  format: ImageFormat,
  scale: 1 | 2 = 1,
  quality: number = 0.92
): Promise<{ name: string; data: Uint8Array }> {
  const blob = await cropSvgToImageBlob(svgString, panelX, totalWidth, panelWidth, panelHeight, format, scale, quality)
  return { name: filename, data: new Uint8Array(await blob.arrayBuffer()) }
}

export function exportSvg(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
