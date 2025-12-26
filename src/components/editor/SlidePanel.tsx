import { useEditorStore } from '@/store/editor-store'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { isRTLText } from '@/lib/utils'
import { CANVAS_CONFIG } from '@/constants'

export function SlidePanel() {
  const { slides, currentSlideIndex, setCurrentSlide, addSlide, deleteSlide } =
    useEditorStore()

  return (
    <div className="w-48 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-2 border-b border-gray-200">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={addSlide}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Slide
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`group relative cursor-pointer rounded border-2 transition-colors ${
              index === currentSlideIndex
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setCurrentSlide(index)}
          >
            <div className="aspect-video bg-white rounded overflow-hidden relative">
              {/* Thumbnail preview */}
              <div
                className="absolute inset-0"
                style={{
                  transform: `scale(${CANVAS_CONFIG.thumbnailScale})`,
                  transformOrigin: 'top left',
                  width: `${CANVAS_CONFIG.width}px`,
                  height: `${CANVAS_CONFIG.height}px`,
                }}
              >
                {slide.elements.map((element) => (
                  <div
                    key={element.id}
                    className="absolute"
                    style={{
                      left: `${element.x}px`,
                      top: `${element.y}px`,
                      width: `${element.width}px`,
                      height: `${element.height}px`,
                      transform: `rotate(${element.rotation}deg)`,
                    }}
                  >
                    {element.type === 'text' && (
                      <div
                        className="text-xs whitespace-nowrap overflow-hidden"
                        style={{
                          fontSize: `${(element.fontSize || 16) * CANVAS_CONFIG.thumbnailScale}px`,
                          color: element.fontColor || '#000000',
                          textAlign: element.textAlign || 'left',
                          direction: isRTLText(element.content) ? 'rtl' : 'ltr',
                        }}
                      >
                        {element.content || 'Text'}
                      </div>
                    )}
                    {element.type === 'shape' && (
                      <div
                        className="border"
                        style={{
                          backgroundColor: element.color || '#3b82f6',
                          borderRadius: `${(element.borderRadius || 0) * CANVAS_CONFIG.thumbnailScale}px`,
                          width: '100%',
                          height: '100%',
                        }}
                      />
                    )}
                    {element.type === 'image' && (
                      <div
                        className="bg-gray-200 border border-gray-300"
                        style={{
                          borderRadius: `${(element.borderRadius || 0) * CANVAS_CONFIG.thumbnailScale}px`,
                          width: '100%',
                          height: '100%',
                          backgroundImage: element.imageUrl
                            ? `url(${element.imageUrl})`
                            : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-2 text-xs text-center text-gray-600">
              Slide {index + 1}
            </div>
            {slides.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSlide(index)
                }}
              >
                <Trash2 className="h-3 w-3 text-red-600" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
