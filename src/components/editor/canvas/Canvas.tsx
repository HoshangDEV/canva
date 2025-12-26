import { useRef, useEffect } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { CANVAS_CONFIG } from '@/constants'
import { useFabricCanvas } from './hooks/useFabricCanvas'
import { useCanvasSync } from './hooks/useCanvasSync'
import { useCanvasEvents } from './hooks/useCanvasEvents'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const hasInitialZoomRef = useRef(false)

  const zoom = useEditorStore((state) => state.zoom)
  const setZoom = useEditorStore((state) => state.setZoom)
  const setCanvasRef = useEditorStore((state) => state.setCanvasRef)

  // Initialize Fabric.js canvas
  const { canvasRef, fabricCanvas } = useFabricCanvas()

  // Register canvas with store
  useEffect(() => {
    if (fabricCanvas) {
      setCanvasRef(fabricCanvas)
    }
    return () => {
      if (fabricCanvas) {
        setCanvasRef(null)
      }
    }
  }, [fabricCanvas, setCanvasRef])

  // Sync store elements ↔ canvas objects (with differential updates)
  const { isUpdatingRef } = useCanvasSync(fabricCanvas)

  // Handle canvas events (selection, modification, text changes)
  useCanvasEvents(fabricCanvas, { isUpdatingRef })

  // Keyboard shortcuts (delete, etc.)
  useKeyboardShortcuts(fabricCanvas)

  // Calculate and set initial zoom to fit available width
  useEffect(() => {
    if (hasInitialZoomRef.current || !containerRef.current) return

    const calculateZoom = () => {
      if (!containerRef.current || hasInitialZoomRef.current) return

      const container = containerRef.current
      const containerWidth = container.clientWidth
      const padding = 32 * 2 // p-8 = 32px on each side
      const availableWidth = containerWidth - padding

      const calculatedZoom = availableWidth / CANVAS_CONFIG.width

      if (calculatedZoom > 0.1 && calculatedZoom <= 1) {
        setZoom(calculatedZoom)
        hasInitialZoomRef.current = true
      }
    }

    const timeoutId = setTimeout(calculateZoom, 100)

    const handleResize = () => {
      if (!hasInitialZoomRef.current) {
        calculateZoom()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
    }
  }, [setZoom])

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center p-8 overflow-auto bg-muted"
    >
      <div
        className="bg-card shadow-lg"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
