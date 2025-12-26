import { useEffect, useRef, useCallback } from 'react'
import { Canvas as FabricCanvas, Textbox, FabricObject } from 'fabric'
import { useEditorStore } from '@/store/editor-store'

interface UseCanvasEventsOptions {
  isUpdatingRef: React.MutableRefObject<boolean>
}

/**
 * Hook to handle Fabric.js canvas events (selection, modification, text changes)
 */
export function useCanvasEvents(
  fabricCanvas: FabricCanvas | null,
  options: UseCanvasEventsOptions
): void {
  const { isUpdatingRef } = options

  const selectElement = useEditorStore((state) => state.selectElement)
  const updateElement = useEditorStore((state) => state.updateElement)

  // Use refs for callbacks to avoid stale closures
  const selectElementRef = useRef(selectElement)
  const updateElementRef = useRef(updateElement)

  useEffect(() => {
    selectElementRef.current = selectElement
    updateElementRef.current = updateElement
  }, [selectElement, updateElement])

  // Handle selection
  const handleSelection = useCallback(
    (e: { selected?: FabricObject[] }) => {
      if (isUpdatingRef.current) return

      const selected = e.selected
        ?.map((obj) => obj.get('elementId'))
        .filter((id): id is string => typeof id === 'string') || []

      if (selected.length > 0) {
        selectElementRef.current(selected[0], false)
        selected.slice(1).forEach((id) => selectElementRef.current(id, true))
      }
    },
    [isUpdatingRef]
  )

  const handleSelectionCleared = useCallback(() => {
    if (isUpdatingRef.current) return
    selectElementRef.current(null)
  }, [isUpdatingRef])

  // Handle object modification (move, resize, rotate)
  const handleObjectModified = useCallback(
    (e: { target?: FabricObject }) => {
      if (isUpdatingRef.current) return

      const obj = e.target
      if (!obj) return

      const elementId = obj.get('elementId') as string | undefined
      if (!elementId) return

      // Calculate dimensions from scale
      const width = (obj.width || 0) * (obj.scaleX || 1)
      const height = (obj.height || 0) * (obj.scaleY || 1)

      updateElementRef.current(elementId, {
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
        obj.set({ width, height })
      }

      fabricCanvas?.renderAll()
    },
    [isUpdatingRef, fabricCanvas]
  )

  // Handle text changes
  const handleTextChanged = useCallback(
    (e: { target?: FabricObject }) => {
      if (isUpdatingRef.current) return

      const obj = e.target as Textbox | undefined
      if (!obj) return

      const elementId = obj.get('elementId') as string | undefined
      if (!elementId) return

      updateElementRef.current(elementId, {
        content: obj.text || '',
      })
    },
    [isUpdatingRef]
  )

  // Attach event listeners
  useEffect(() => {
    if (!fabricCanvas) return

    fabricCanvas.on('selection:created', handleSelection)
    fabricCanvas.on('selection:updated', handleSelection)
    fabricCanvas.on('selection:cleared', handleSelectionCleared)
    fabricCanvas.on('object:modified', handleObjectModified)
    fabricCanvas.on('text:changed', handleTextChanged)

    return () => {
      fabricCanvas.off('selection:created', handleSelection)
      fabricCanvas.off('selection:updated', handleSelection)
      fabricCanvas.off('selection:cleared', handleSelectionCleared)
      fabricCanvas.off('object:modified', handleObjectModified)
      fabricCanvas.off('text:changed', handleTextChanged)
    }
  }, [
    fabricCanvas,
    handleSelection,
    handleSelectionCleared,
    handleObjectModified,
    handleTextChanged,
  ])
}
