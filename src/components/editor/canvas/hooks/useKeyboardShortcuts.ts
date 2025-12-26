import { useEffect } from 'react'
import { Canvas as FabricCanvas, ActiveSelection, FabricObject } from 'fabric'
import { useEditorStore } from '@/store/editor-store'

/**
 * Hook to handle keyboard shortcuts for canvas operations
 */
export function useKeyboardShortcuts(fabricCanvas: FabricCanvas | null): void {
  const deleteElement = useEditorStore((state) => state.deleteElement)

  useEffect(() => {
    if (!fabricCanvas) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected elements
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const activeObject = fabricCanvas.getActiveObject()
        if (!activeObject) return

        // Check if we're editing text (don't delete element while typing)
        if (activeObject.type === 'textbox') {
          const textbox = activeObject as unknown as { isEditing?: boolean }
          if (textbox.isEditing) return
        }

        e.preventDefault()

        if (activeObject.type === 'activeSelection') {
          const selection = activeObject as ActiveSelection
          selection.getObjects().forEach((obj: FabricObject) => {
            const elementId = obj.get('elementId')
            if (typeof elementId === 'string') {
              deleteElement(elementId)
            }
          })
        } else {
          const elementId = activeObject.get('elementId')
          if (typeof elementId === 'string') {
            deleteElement(elementId)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fabricCanvas, deleteElement])
}
