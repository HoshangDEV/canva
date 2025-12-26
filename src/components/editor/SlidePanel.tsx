import { useEditorStore } from '@/store/editor-store'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SlidePanel() {
  const { slides, currentSlideIndex, setCurrentSlide, addSlide, deleteSlide } =
    useEditorStore()

  return (
    <div className="w-48 bg-card border-r border-border flex flex-col">
      <div className="p-2 border-b border-border">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={addSlide}
        >
          <Plus />
          Add Slide
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              'group relative cursor-pointer rounded border-2 transition-colors',
              index === currentSlideIndex
                ? 'border-primary bg-accent'
                : 'border-border hover:border-border',
            )}
            onClick={() => setCurrentSlide(index)}
          >
            <div className="aspect-video bg-card rounded flex items-center justify-center">
              <div className="text-2xl font-semibold text-muted-foreground">
                {index + 1}
              </div>
            </div>
            {slides.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSlide(index)
                }}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
