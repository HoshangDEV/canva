import { useEditorStore } from '@/store/editor-store'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FileStack, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LeftSidebar() {
  const { activePanel, setActivePanel } = useEditorStore()

  return (
    <div className="w-12 bg-card border-r border-border flex flex-col items-center py-2 gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activePanel === 'slides' ? 'default' : 'ghost'}
            size="icon"
            className={cn(
              'w-10 h-10',
              activePanel === 'slides' && 'bg-primary text-primary-foreground'
            )}
            onClick={() => setActivePanel('slides')}
          >
            <FileStack className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Slides</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activePanel === 'layers' ? 'default' : 'ghost'}
            size="icon"
            className={cn(
              'w-10 h-10',
              activePanel === 'layers' && 'bg-primary text-primary-foreground'
            )}
            onClick={() => setActivePanel('layers')}
          >
            <Layers className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Layers</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

