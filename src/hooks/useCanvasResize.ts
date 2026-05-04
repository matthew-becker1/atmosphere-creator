import { useCallback, useRef } from 'react'
import { useStore } from '../store/useStore'

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const MIN_SIZE = 100
const MAX_SIZE = 4000

export function useCanvasResize(scale: number, setIsResizing: (v: boolean) => void) {
  const setDimensions = useStore((s) => s.setDimensions)
  const width = useStore((s) => s.width)
  const height = useStore((s) => s.height)
  const dragRef = useRef<{
    startX: number
    startY: number
    startW: number
    startH: number
    startScale: number
    dir: ResizeDirection
  } | null>(null)

  const handleMouseDown = useCallback(
    (dir: ResizeDirection) => (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      setIsResizing(true)
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startW: width,
        startH: height,
        startScale: scale,
        dir,
      }

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragRef.current) return
        const { startX, startY, startW, startH, startScale, dir } = dragRef.current
        const deltaX = (moveEvent.clientX - startX) / startScale
        const deltaY = (moveEvent.clientY - startY) / startScale

        let newW = startW
        let newH = startH

        if (dir.includes('e')) newW = Math.round(Math.min(MAX_SIZE, Math.max(MIN_SIZE, startW + deltaX)))
        else if (dir.includes('w')) newW = Math.round(Math.min(MAX_SIZE, Math.max(MIN_SIZE, startW - deltaX)))

        if (dir.includes('s')) newH = Math.round(Math.min(MAX_SIZE, Math.max(MIN_SIZE, startH + deltaY)))
        else if (dir.includes('n')) newH = Math.round(Math.min(MAX_SIZE, Math.max(MIN_SIZE, startH - deltaY)))

        setDimensions(newW, newH)
      }

      const cleanup = () => {
        dragRef.current = null
        setIsResizing(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', cleanup)
        window.removeEventListener('blur', cleanup)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', cleanup)
      window.addEventListener('blur', cleanup)
    },
    [scale, width, height, setDimensions, setIsResizing]
  )

  return { handleMouseDown }
}
