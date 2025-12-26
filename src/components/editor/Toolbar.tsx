import { useState, useEffect } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { Button } from '@/components/ui/button'
import {
  Undo2,
  Redo2,
  Sparkles,
  Type,
  Square,
  Image as ImageIcon,
} from 'lucide-react'
import { AIDialog } from './AIDialog'

export function Toolbar() {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    addElement,
  } = useEditorStore()

  const [aiDialogOpen, setAIDialogOpen] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Cmd+Z / Ctrl+Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo()) undo()
      }

      // Redo: Cmd+Shift+Z / Ctrl+Shift+Z / Ctrl+Y
      if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') ||
        (e.ctrlKey && !e.metaKey && e.key === 'y')
      ) {
        e.preventDefault()
        if (canRedo()) redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, canUndo, canRedo])

  const handleAddText = () => {
    addElement({
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      rotation: 0,
      content: 'New Text',
      fontSize: 24,
      fontColor: '#000000',
      fontFamily: 'Arial',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
    })
  }

  const handleAddShape = () => {
    addElement({
      type: 'shape',
      x: 100,
      y: 100,
      width: 150,
      height: 150,
      rotation: 0,
      color: '#3b82f6',
      borderRadius: 4,
    })
  }

  const handleAddImage = () => {
    addElement({
      type: 'image',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      rotation: 0,
      imageUrl: '',
      borderRadius: 0,
    })
  }

  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-white border-b border-gray-200">
        <Button
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={!canUndo()}
          title="Undo (Cmd+Z / Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={redo}
          disabled={!canRedo()}
          title="Redo (Cmd+Shift+Z / Ctrl+Y)"
        >
          <Redo2 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => setAIDialogOpen(true)}
        >
          <Sparkles />
          AI Prompt
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button variant="outline" size="sm" onClick={handleAddText}>
          <Type />
          Add Text
        </Button>
        <Button variant="outline" size="sm" onClick={handleAddShape}>
          <Square />
          Add Shape
        </Button>
        <Button variant="outline" size="sm" onClick={handleAddImage}>
          <ImageIcon />
          Add Image
        </Button>
      </div>

      <AIDialog open={aiDialogOpen} onOpenChange={setAIDialogOpen} />
    </>
  )
}
