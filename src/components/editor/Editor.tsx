import { useEffect } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { Toolbar } from './Toolbar'
import { Canvas } from './canvas'
import { SlidePanel } from './SlidePanel'
import { PropertiesPanel } from './PropertiesPanel'
import { AIDialog } from './AIDialog'

export function Editor() {
  const { saveSnapshot } = useEditorStore()

  // Save initial snapshot
  useEffect(() => {
    saveSnapshot()
  }, [saveSnapshot])

  return (
    <div className="flex flex-col h-screen bg-muted">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <SlidePanel />
        <Canvas />
        <PropertiesPanel />
      </div>
      <AIDialog />
    </div>
  )
}

