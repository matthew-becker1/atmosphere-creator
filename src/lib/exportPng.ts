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
      
      // For JPG, fill white background first (no transparency)
      if (format === 'jpg') {
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      
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

export function exportSvg(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
