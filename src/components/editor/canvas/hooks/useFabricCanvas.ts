import { useEffect, useRef, useState } from 'react'
import { Canvas as FabricCanvas } from 'fabric'
import { CANVAS_CONFIG } from '@/constants'

interface UseFabricCanvasReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  fabricCanvas: FabricCanvas | null
}

/**
 * Hook to initialize and manage a Fabric.js canvas instance
 */
export function useFabricCanvas(): UseFabricCanvasReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new FabricCanvas(canvasRef.current, {
      width: CANVAS_CONFIG.width,
      height: CANVAS_CONFIG.height,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    })

    setFabricCanvas(canvas)

    return () => {
      canvas.dispose()
      setFabricCanvas(null)
    }
  }, [])

  return { canvasRef, fabricCanvas }
}
