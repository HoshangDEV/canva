import { useEffect, useRef } from 'react'
import { Canvas as FabricCanvas, ActiveSelection, FabricObject } from 'fabric'
import { useEditorStore } from '@/store/editor-store'
import type { SlideElement } from '@/types/editor'
import { diffElements, isImageUrlChanged } from '../utils/diffElements'
import { createElement, updateFabricObject } from '../factories'

interface UseCanvasSyncReturn {
  isUpdatingRef: React.MutableRefObject<boolean>
}

/**
 * Hook to synchronize Zustand store state with Fabric.js canvas
 * Uses differential updates instead of clearing the entire canvas
 */
export function useCanvasSync(fabricCanvas: FabricCanvas | null): UseCanvasSyncReturn {
  const isUpdatingRef = useRef(false)
  const prevElementsRef = useRef<SlideElement[]>([])
  const elementMapRef = useRef<Map<string, FabricObject>>(new Map())

  const slides = useEditorStore((state) => state.slides)
  const currentSlideIndex = useEditorStore((state) => state.currentSlideIndex)
  const selectedElementIds = useEditorStore((state) => state.selectedElementIds)

  const currentSlide = slides[currentSlideIndex] || slides[0]
  const currentElements = currentSlide?.elements || []

  // Sync elements from store to canvas
  useEffect(() => {
    if (!fabricCanvas) return

    const syncElements = async () => {
      isUpdatingRef.current = true

      const prevElements = prevElementsRef.current
      const diff = diffElements(prevElements, currentElements)

      // Handle removed elements
      for (const elementId of diff.removed) {
        const obj = elementMapRef.current.get(elementId)
        if (obj) {
          fabricCanvas.remove(obj)
          elementMapRef.current.delete(elementId)
        }
      }

      // Handle added elements
      for (const element of diff.added) {
        try {
          const obj = await createElement(element, fabricCanvas)
          fabricCanvas.add(obj)
          elementMapRef.current.set(element.id, obj)
        } catch (error) {
          console.error(`Failed to create element ${element.id}:`, error)
        }
      }

      // Handle updated elements
      for (const element of diff.updated) {
        const obj = elementMapRef.current.get(element.id)
        if (obj) {
          // Check if image URL changed - requires recreation
          const prevElement = prevElements.find((e) => e.id === element.id)
          if (prevElement && isImageUrlChanged(prevElement, element)) {
            // Remove old object and create new one
            fabricCanvas.remove(obj)
            try {
              const newObj = await createElement(element, fabricCanvas)
              fabricCanvas.add(newObj)
              elementMapRef.current.set(element.id, newObj)
            } catch (error) {
              console.error(`Failed to recreate element ${element.id}:`, error)
            }
          } else {
            // Update in place
            updateFabricObject(obj, element)
          }
        }
      }

      // Reorder objects to match element order (z-index)
      const orderedObjects: FabricObject[] = []
      for (const element of currentElements) {
        const obj = elementMapRef.current.get(element.id)
        if (obj) {
          orderedObjects.push(obj)
        }
      }

      // Clear and re-add in correct order
      if (orderedObjects.length > 0) {
        const allObjects = fabricCanvas.getObjects()
        for (const obj of allObjects) {
          if (obj.get('elementId')) {
            fabricCanvas.remove(obj)
          }
        }
        for (const obj of orderedObjects) {
          fabricCanvas.add(obj)
        }
      }

      prevElementsRef.current = currentElements

      fabricCanvas.renderAll()
      isUpdatingRef.current = false
    }

    syncElements()
  }, [fabricCanvas, currentElements])

  // Handle slide change - clear and rebuild
  useEffect(() => {
    if (!fabricCanvas) return

    // Clear everything when slide changes
    isUpdatingRef.current = true
    fabricCanvas.clear()
    fabricCanvas.backgroundColor = '#ffffff'
    elementMapRef.current.clear()
    prevElementsRef.current = []
    isUpdatingRef.current = false

    // Elements will be synced by the other effect
  }, [fabricCanvas, currentSlideIndex])

  // Sync selection from store to canvas
  useEffect(() => {
    if (!fabricCanvas || isUpdatingRef.current) return

    isUpdatingRef.current = true

    const activeObjects = fabricCanvas.getObjects().filter((obj) => {
      const elementId = obj.get('elementId')
      return typeof elementId === 'string' && selectedElementIds.includes(elementId)
    })

    if (activeObjects.length === 0) {
      fabricCanvas.discardActiveObject()
    } else if (activeObjects.length === 1) {
      fabricCanvas.setActiveObject(activeObjects[0])
    } else {
      const selection = new ActiveSelection(activeObjects, { canvas: fabricCanvas })
      fabricCanvas.setActiveObject(selection)
    }

    fabricCanvas.renderAll()
    isUpdatingRef.current = false
  }, [fabricCanvas, selectedElementIds])

  return { isUpdatingRef }
}
