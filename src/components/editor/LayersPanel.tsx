import { useEditorStore } from '@/store/editor-store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, ChevronUp, ChevronDown, Trash2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SlideElement } from '@/types/editor'

function getElementIcon(type: SlideElement['type']) {
  switch (type) {
    case 'text':
      return 'T'
    case 'shape':
      return '□'
    case 'image':
      return '🖼'
    default:
      return '•'
  }
}

function getElementName(element: SlideElement): string {
  switch (element.type) {
    case 'text':
      return element.content?.substring(0, 20) || 'Text'
    case 'shape':
      return 'Shape'
    case 'image':
      return 'Image'
    default:
      return 'Element'
  }
}

export function LayersPanel() {
  const {
    slides,
    currentSlideIndex,
    selectedElementIds,
    selectElement,
    deleteElement,
    duplicateElement,
    bringForward,
    sendBackward,
  } = useEditorStore()

  const currentSlide = slides[currentSlideIndex] || slides[0]
  const elements = currentSlide.elements

  const handleLayerClick = (elementId: string, e: React.MouseEvent) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      selectElement(elementId, true) // Add to selection
    } else {
      selectElement(elementId, false) // Single selection
    }
  }

  const handleMoveUp = (index: number) => {
    if (index < elements.length - 1) {
      selectElement(elements[index].id, false)
      bringForward()
    }
  }

  const handleMoveDown = (index: number) => {
    if (index > 0) {
      selectElement(elements[index].id, false)
      sendBackward()
    }
  }

  return (
    <div className="w-48 bg-card border-r border-border flex flex-col">
      <div className="p-2 border-b border-border">
        <h3 className="text-sm font-semibold">Layers</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {elements.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No layers yet
          </p>
        ) : (
          <div className="space-y-1">
            {/* Render layers in reverse order (top to bottom) */}
            {[...elements].reverse().map((element, reverseIndex) => {
              const actualIndex = elements.length - 1 - reverseIndex
              const isSelected = selectedElementIds.includes(element.id)
              const isTop = actualIndex === elements.length - 1
              const isBottom = actualIndex === 0

              return (
                <div
                  key={element.id}
                  className={cn(
                    'group flex items-center gap-1 p-1.5 rounded text-sm cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-primary/10 border border-primary'
                      : 'hover:bg-accent border border-transparent'
                  )}
                  onClick={(e) => handleLayerClick(element.id, e)}
                >
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono shrink-0">
                      {getElementIcon(element.type)}
                    </span>
                    <span className="truncate text-xs">
                      {getElementName(element)}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveUp(actualIndex)
                        }}
                        disabled={isTop}
                      >
                        <ChevronUp className="mr-2 h-4 w-4" />
                        Move Up
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveDown(actualIndex)
                        }}
                        disabled={isBottom}
                      >
                        <ChevronDown className="mr-2 h-4 w-4" />
                        Move Down
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          duplicateElement(element.id)
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteElement(element.id)
                        }}
                        variant="destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

