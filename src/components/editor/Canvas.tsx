import { useEffect, useRef } from 'react'
import {
  Canvas as FabricCanvas,
  Textbox,
  Rect,
  Image as FabricImage,
  ActiveSelection,
  FabricObject,
} from 'fabric'
import { useEditorStore } from '@/store/editor-store'
import { isRTLText } from '@/lib/utils'
import type { SlideElement } from '@/types/editor'
import { CANVAS_CONFIG } from '@/constants'

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<FabricCanvas | null>(null)
  const isUpdatingRef = useRef(false)

  const {
    slides,
    currentSlideIndex,
    selectedElementIds,
    selectElement,
    updateElement,
    deleteElement,
    zoom,
    setZoom,
  } = useEditorStore()

  const currentSlide = slides[currentSlideIndex] || slides[0]

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new FabricCanvas(canvasRef.current, {
      width: CANVAS_CONFIG.width,
      height: CANVAS_CONFIG.height,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    })

    fabricCanvasRef.current = canvas

    // Handle selection changes
    canvas.on('selection:created', (e: any) => {
      if (isUpdatingRef.current) return
      const selected =
        e.selected?.map((obj: any) => obj.get('elementId')).filter(Boolean) ||
        []
      if (selected.length > 0) {
        selectElement(selected[0], false)
        if (selected.length > 1) {
          selected.slice(1).forEach((id: string) => selectElement(id, true))
        }
      }
    })

    canvas.on('selection:updated', (e: any) => {
      if (isUpdatingRef.current) return
      const selected =
        e.selected?.map((obj: any) => obj.get('elementId')).filter(Boolean) ||
        []
      if (selected.length > 0) {
        selectElement(selected[0], false)
        if (selected.length > 1) {
          selected.slice(1).forEach((id: string) => selectElement(id, true))
        }
      }
    })

    canvas.on('selection:cleared', () => {
      if (isUpdatingRef.current) return
      selectElement(null)
    })

    // Handle object modifications
    canvas.on('object:modified', (e: any) => {
      if (isUpdatingRef.current) return
      const obj = e.target
      if (!obj) return

      const elementId = obj.get('elementId') as string | undefined
      if (!elementId) return

      // Calculate dimensions from scale for all objects including textbox
      const width = (obj.width || 0) * (obj.scaleX || 1)
      const height = (obj.height || 0) * (obj.scaleY || 1)

      updateElement(elementId, {
        x: obj.left || 0,
        y: obj.top || 0,
        width,
        height,
        rotation: obj.angle || 0,
      })

      // Reset scale to 1 after applying to width/height
      obj.set({ scaleX: 1, scaleY: 1 })

      // For textbox, update the fixed dimensions
      if (obj.type === 'textbox') {
        obj.set({
          width: width,
          height: height,
        })
      }

      canvas.renderAll()
    })

    // Handle text editing
    canvas.on('text:changed', (e: any) => {
      if (isUpdatingRef.current) return
      const obj = e.target as Textbox
      if (!obj) return

      const elementId = obj.get('elementId') as string | undefined
      if (!elementId) return

      // Update content only - don't change dimensions (height stays fixed)
      updateElement(elementId, {
        content: obj.text || '',
        // Keep width and height as they are - don't auto-adjust
      })
    })

    // Handle textbox resizing - allow both width and height to be resized manually
    canvas.on('object:scaling', (e: any) => {
      if (isUpdatingRef.current) return
      const obj = e.target
      if (!obj || obj.type !== 'textbox') return

      // Update coordinates for visual feedback
      // Actual dimension updates happen in object:modified handler
      obj.setCoords()
    })

    // Prevent objects from moving outside canvas
    canvas.on('object:moving', (e: any) => {
      const obj = e.target
      if (!obj) return

      // Canvas bounds
      const canvasWidth = CANVAS_CONFIG.width
      const canvasHeight = CANVAS_CONFIG.height

      // Update coordinates for accurate bounds checking
      obj.setCoords()

      // Get the bounding box accounting for rotation
      const boundingRect = obj.getBoundingRect()

      // Calculate how much the bounding rect extends beyond canvas bounds
      const overflowLeft = Math.min(0, boundingRect.left)
      const overflowRight = Math.max(0, (boundingRect.left + boundingRect.width) - canvasWidth)
      const overflowTop = Math.min(0, boundingRect.top)
      const overflowBottom = Math.max(0, (boundingRect.top + boundingRect.height) - canvasHeight)

      // Calculate the adjustment needed for the bounding rect
      const boundingDeltaX = overflowLeft + overflowRight
      const boundingDeltaY = overflowTop + overflowBottom

      // Apply the constraint only if there's overflow
      if (boundingDeltaX !== 0 || boundingDeltaY !== 0) {
        // For rotated objects, we need to translate the bounding rect adjustment
        // to the object origin adjustment. The relationship depends on rotation.
        // For simplicity, we apply the same delta to the object origin.
        // This works because setCoords() will recalculate the bounding rect correctly.
        obj.set({
          left: (obj.left || 0) + boundingDeltaX,
          top: (obj.top || 0) + boundingDeltaY,
        })
        obj.setCoords()
      }
    })

    // Zoom with Ctrl+Scroll
    canvas.on('mouse:wheel', (opt: any) => {
      if (opt.e.ctrlKey || opt.e.metaKey) {
        opt.e.preventDefault()
        const delta = opt.e.deltaY
        let newZoom = zoom
        newZoom *= 0.999 ** delta

        if (newZoom > 3) newZoom = 3
        if (newZoom < 0.25) newZoom = 0.25

        canvas.setZoom(newZoom)
        setZoom(newZoom)
      }
    })

    return () => {
      canvas.dispose()
    }
  }, [selectElement, updateElement, setZoom])

  // Sync zoom to canvas
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return
    canvas.setZoom(zoom)
    canvas.renderAll()
  }, [zoom])

  // Render elements from store
  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return

    isUpdatingRef.current = true

    // Clear canvas
    canvas.clear()
    canvas.backgroundColor = '#ffffff'

    // Render each element
    currentSlide.elements.forEach((element) => {
      const fabricObject = createFabricObject(element, canvas)
      if (fabricObject) {
        fabricObject.set('elementId', element.id)
        canvas.add(fabricObject)
      }
    })

    // Update selection
    const activeObjects = canvas.getObjects().filter((obj: FabricObject) => {
      const elementId = obj.get('elementId')
      return selectedElementIds.includes(elementId as string)
    })

    if (activeObjects.length > 0) {
      if (activeObjects.length === 1) {
        canvas.setActiveObject(activeObjects[0])
      } else {
        const selection = new ActiveSelection(activeObjects, {
          canvas: canvas,
        })
        canvas.setActiveObject(selection)
      }
    } else {
      canvas.discardActiveObject()
    }

    canvas.renderAll()
    isUpdatingRef.current = false
  }, [currentSlide, selectedElementIds])

  // Handle keyboard delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const canvas = fabricCanvasRef.current
        if (!canvas) return

        const activeObject = canvas.getActiveObject()
        if (activeObject) {
          e.preventDefault()
          if (activeObject.type === 'activeSelection') {
            const selection = activeObject as ActiveSelection
            selection.getObjects().forEach((obj: FabricObject) => {
              const elementId = obj.get('elementId')
              if (elementId) deleteElement(elementId as string)
            })
          } else {
            const elementId = activeObject.get('elementId')
            if (elementId) deleteElement(elementId as string)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteElement])

  return (
    <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-gray-100">
      <div
        className="bg-white shadow-lg"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center',
        }}
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

function createFabricObject(
  element: SlideElement,
  canvas: FabricCanvas,
): FabricObject | null {
  switch (element.type) {
    case 'text': {
      const text = new Textbox(element.content || 'Text', {
        left: element.x,
        top: element.y,
        width: element.width,
        angle: element.rotation || 0, // Set rotation angle
        fontSize: element.fontSize || 16,
        fill: element.fontColor || '#000000',
        fontFamily: element.fontFamily || 'Arial',
        fontWeight: element.fontWeight || 'normal',
        fontStyle: element.fontStyle || 'normal',
        textAlign: element.textAlign || 'left',
        splitByGrapheme: true, // Better text wrapping support
        lockScalingFlip: true, // Prevent flipping when resizing
        lockUniScaling: false, // Allow independent width/height scaling
      })

      // Set direction for RTL text
      if (isRTLText(element.content)) {
        text.set('direction', 'rtl')
      }

      // Set fixed dimensions - override auto-height calculation
      const fixedHeight = element.height || 50
      text.set({
        width: element.width,
        height: fixedHeight, // Use fixed height from element
      })

      // Override initDimensions to prevent auto-height recalculation
      const originalInitDimensions = text.initDimensions.bind(text)
      text.initDimensions = function () {
        // Call original but then restore fixed height
        originalInitDimensions()
        // Always restore the fixed height from element
        this.set('height', fixedHeight)
      }

      // Force the height to stay fixed after any operation
      text.set({
        height: fixedHeight,
      })

      // Re-initialize to apply the fixed height
      text.initDimensions()

      // Update coordinates to ensure rotation controls are positioned correctly
      text.setCoords()

      return text
    }

    case 'shape': {
      const rect = new Rect({
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        angle: element.rotation || 0, // Set rotation angle
        fill: element.color || '#3b82f6',
        rx: element.borderRadius || 4,
        ry: element.borderRadius || 4,
      })
      // Update coordinates to ensure rotation controls are positioned correctly
      rect.setCoords()
      return rect
    }

    case 'image': {
      // Return a placeholder rect for now, images will be loaded asynchronously
      const placeholder = new Rect({
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        angle: element.rotation || 0, // Set rotation angle
        fill: '#e5e7eb',
        stroke: '#9ca3af',
        strokeWidth: 1,
        rx: element.borderRadius || 0,
        ry: element.borderRadius || 0,
      })
      // Update coordinates to ensure rotation controls are positioned correctly
      placeholder.setCoords()

      // Load image if URL is provided
      if (element.imageUrl) {
        FabricImage.fromURL(element.imageUrl, {
          crossOrigin: 'anonymous',
        })
          .then((img: FabricImage) => {
            img.set({
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              angle: element.rotation || 0, // Set rotation angle
            })

            // Apply border radius using clipPath if needed
            if (element.borderRadius && element.borderRadius > 0) {
              const clipPath = new Rect({
                width: element.width,
                height: element.height,
                rx: element.borderRadius,
                ry: element.borderRadius,
                left: -element.width / 2,
                top: -element.height / 2,
              })
              img.set({ clipPath })
            }

            // Update coordinates to ensure rotation controls are positioned correctly
            img.setCoords()

            // Find and replace placeholder in canvas
            const objects = canvas.getObjects()
            const placeholderObj = objects.find(
              (obj: FabricObject) => obj.get('elementId') === element.id,
            )
            if (placeholderObj) {
              img.set('elementId', element.id)
              canvas.remove(placeholderObj)
              canvas.add(img)
              canvas.renderAll()
            }
          })
          .catch((error) => {
            console.error('Failed to load image:', error)
          })
      }

      return placeholder
    }

    default:
      return null
  }
}
