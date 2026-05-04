export type ImageFormat = 'png' | 'webp' | 'jpg'

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
      const ctx = canvas.getContext('2d')!
      
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

export async function exportTriptychPanel(
  svgString: string,
  panelX: number,
  totalWidth: number,
  panelWidth: number,
  panelHeight: number,
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
      const fullCanvas = document.createElement('canvas')
      fullCanvas.width = totalWidth * scale
      fullCanvas.height = panelHeight * scale
      const fullCtx = fullCanvas.getContext('2d')!
      fullCtx.drawImage(img, 0, 0, totalWidth * scale, panelHeight * scale)
      URL.revokeObjectURL(url)

      const panelCanvas = document.createElement('canvas')
      panelCanvas.width = panelWidth * scale
      panelCanvas.height = panelHeight * scale
      const panelCtx = panelCanvas.getContext('2d')!
      panelCtx.drawImage(
        fullCanvas,
        panelX * scale, 0, panelWidth * scale, panelHeight * scale,
        0, 0, panelWidth * scale, panelHeight * scale
      )

      const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`
      panelCanvas.toBlob((imageBlob) => {
        if (!imageBlob) { reject(new Error(`${format.toUpperCase()} triptych export failed`)); return }
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

export function exportSvg(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
