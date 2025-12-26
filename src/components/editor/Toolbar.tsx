import { useState, useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { Button } from '@/components/ui/button'
import type { EditorExportData } from '@/types/editor'
import { toast } from 'sonner'
import {
  Undo2,
  Redo2,
  Sparkles,
  Type,
  Square,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
} from 'lucide-react'
import { AIDialog } from './AIDialog'
import { ThemeToggle } from '../theme/theme-toggle'

export function Toolbar() {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    addElement,
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
    exportCanvas,
    importCanvas,
  } = useEditorStore()

  const [aiDialogOpen, setAIDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleExport = () => {
    exportCanvas()
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const data: EditorExportData = JSON.parse(text)
        importCanvas(data)
        toast.success('Canvas imported successfully!')
      } catch (error) {
        console.error('Failed to import canvas:', error)
        toast.error(
          `Failed to import canvas: ${error instanceof Error ? error.message : 'Invalid file format'}`
        )
      }
    }
    reader.onerror = () => {
      toast.error('Failed to read file')
    }
    reader.readAsText(file)
    
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-card border-b border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={!canUndo()}
          title="Undo (Cmd+Z / Ctrl+Z)"
        >
          <Undo2 />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={redo}
          disabled={!canRedo()}
          title="Redo (Cmd+Shift+Z / Ctrl+Y)"
        >
          <Redo2 />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => setAIDialogOpen(true)}
        >
          <Sparkles />
          AI Prompt
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button variant="outline" size="sm" onClick={zoomOut} title="Zoom Out">
          <ZoomOut />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={resetZoom}
          title={`Reset Zoom (${Math.round(zoom * 100)}%)`}
        >
          {Math.round(zoom * 100)}%
        </Button>
        <Button variant="outline" size="sm" onClick={zoomIn} title="Zoom In">
          <ZoomIn />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button variant="outline" size="sm" onClick={handleExport} title="Export Canvas">
          <Download />
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={handleImportClick} title="Import Canvas">
          <Upload />
          Import
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="w-px h-6 bg-border mx-1" />

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

        <ThemeToggle size={'icon-sm'} className="ms-auto" />
      </div>

      <AIDialog open={aiDialogOpen} onOpenChange={setAIDialogOpen} />
    </>
  )
}
