import { useCallback, useRef } from 'react'
import { useStore } from '../store/useStore'

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const MIN_SIZE = 200
const MAX_SIZE = 4000

export function useCanvasResize(scale: number) {
  const setDimensions = useStore((s) => s.setDimensions)
  const setIsResizing = useStore((s) => s.setIsResizing)
  const width = useStore((s) => s.width)
  const height = useStore((s) => s.height)
  const dragRef = useRef<{ startX: number; startY: number; startW: number; startH: number; dir: ResizeDirection } | null>(null)

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
        dir,
      }

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragRef.current) return

        const { startX, startY, startW, startH, dir } = dragRef.current
        const deltaX = (moveEvent.clientX - startX) / scale
        const deltaY = (moveEvent.clientY - startY) / scale

        let newW = startW
        let newH = startH

        // Handle horizontal resize
        if (dir.includes('e')) {
          newW = Math.round(Math.min(MAX_SIZE, Math.max(MIN_SIZE, startW + deltaX)))
        } else if (dir.includes('w')) {
          newW = Math.round(Math.min(MAX_SIZE, Math.max(MIN_SIZE, startW - deltaX)))
        }

        // Handle vertical resize
        if (dir.includes('s')) {
          newH = Math.round(Math.min(MAX_SIZE, Math.max(MIN_SIZE, startH + deltaY)))
        } else if (dir.includes('n')) {
          newH = Math.round(Math.min(MAX_SIZE, Math.max(MIN_SIZE, startH - deltaY)))
        }

        setDimensions(newW, newH)
      }

      const handleMouseUp = () => {
        dragRef.current = null
        setIsResizing(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [scale, width, height, setDimensions, setIsResizing]
  )

  return { handleMouseDown }
}
