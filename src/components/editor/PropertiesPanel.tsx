import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { isRTLText } from '@/lib/utils'
import { useEditorStore } from '@/store/editor-store'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  ArrowUpLeft,
  ArrowUpRight,
  Bold,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  ChevronUp,
  Italic,
  Move,
  RotateCcw,
  Trash2,
} from 'lucide-react'

export function PropertiesPanel() {
  const {
    slides,
    currentSlideIndex,
    selectedElementIds,
    updateElement,
    deleteSelectedElements,
    alignElements,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
  } = useEditorStore()

  const currentSlide = slides[currentSlideIndex] || slides[0]
  const selectedElements = currentSlide.elements.filter((el) =>
    selectedElementIds.includes(el.id),
  )

  if (selectedElements.length === 0) {
    return (
      <div className="w-64 bg-card border-l border-border p-4">
        <p className="text-sm text-muted-foreground">
          Select an element to edit
        </p>
      </div>
    )
  }

  if (selectedElements.length > 1) {
    return (
      <div className="w-64 bg-card border-l border-border p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">
          {selectedElements.length} Elements
        </h3>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Alignment</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignElements('top-left')}
                title="Top Left"
              >
                <ArrowUpLeft />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignElements('top-center')}
                title="Top Center"
              >
                <ArrowUp />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignElements('top-right')}
                title="Top Right"
              >
                <ArrowUpRight />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignElements('mid-left')}
                title="Mid Left"
              >
                <ArrowLeft />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignElements('mid-center')}
                title="Mid Center"
              >
                <Move />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignElements('mid-right')}
                title="Mid Right"
              >
                <ArrowRight />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignElements('bottom-left')}
                title="Bottom Left"
              >
                <ArrowDownLeft />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignElements('bottom-center')}
                title="Bottom Center"
              >
                <ArrowDown />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignElements('bottom-right')}
                title="Bottom Right"
              >
                <ArrowDownRight />
              </Button>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Arrange</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={bringToFront}
                title="Bring to Front"
              >
                <ArrowUp />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={bringForward}
                title="Bring Forward"
              >
                <ArrowUpDown />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={sendBackward}
                title="Send Backward"
              >
                <ArrowDown />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={sendToBack}
                title="Send to Back"
              >
                <ArrowDown />
              </Button>
            </div>
          </div>

          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={deleteSelectedElements}
          >
            <Trash2 />
            Delete Selected
          </Button>
        </div>
      </div>
    )
  }

  const element = selectedElements[0]

  return (
    <div className="w-64 bg-card border-l border-border p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4 capitalize">
        {element.type} Properties
      </h3>

      <div className="space-y-4">
        {/* Common Properties */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <Label htmlFor="x">X</Label>
            <Input
              id="x"
              type="number"
              value={Math.round(element.x)}
              onChange={(e) =>
                updateElement(element.id, { x: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-0.5">
            <Label htmlFor="y">Y</Label>
            <Input
              id="y"
              type="number"
              value={Math.round(element.y)}
              onChange={(e) =>
                updateElement(element.id, { y: Number(e.target.value) })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <Label htmlFor="width">Width</Label>
            <Input
              id="width"
              type="number"
              value={Math.round(element.width)}
              onChange={(e) =>
                updateElement(element.id, { width: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-0.5">
            <Label htmlFor="height">Height</Label>
            <Input
              id="height"
              type="number"
              value={Math.round(element.height)}
              onChange={(e) =>
                updateElement(element.id, { height: Number(e.target.value) })
              }
            />
          </div>
        </div>

        <div>
          <Label htmlFor="rotation">
            Rotation: {Math.round(element.rotation)}°{' '}
            <RotateCcw
              onClick={() => updateElement(element.id, { rotation: 0 })}
              className="size-3 ms-auto text-muted-foreground"
            />
          </Label>
          <Slider
            id="rotation"
            min={-180}
            max={180}
            value={[element.rotation]}
            onValueChange={([value]) =>
              updateElement(element.id, { rotation: value })
            }
            className="mt-2"
          />
        </div>

        {/* Alignment */}
        <div>
          <Label className="mb-2 block">Alignment</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignElements('top-left')}
              title="Top Left"
            >
              <ArrowUpLeft />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignElements('top-center')}
              title="Top Center"
            >
              <ArrowUp />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignElements('top-right')}
              title="Top Right"
            >
              <ArrowUpRight />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignElements('mid-left')}
              title="Mid Left"
            >
              <ArrowLeft />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignElements('mid-center')}
              title="Mid Center"
            >
              <Move />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignElements('mid-right')}
              title="Mid Right"
            >
              <ArrowRight />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignElements('bottom-left')}
              title="Bottom Left"
            >
              <ArrowDownLeft />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignElements('bottom-center')}
              title="Bottom Center"
            >
              <ArrowDown />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignElements('bottom-right')}
              title="Bottom Right"
            >
              <ArrowDownRight />
            </Button>
          </div>
        </div>

        {/* Arrange */}
        <div>
          <Label className="mb-2 block">Arrange</Label>
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={bringToFront}
              title="Bring to Front"
            >
              <ChevronsUp />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={bringForward}
              title="Bring Forward"
            >
              <ChevronUp />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={sendBackward}
              title="Send Backward"
            >
              <ChevronDown />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={sendToBack}
              title="Send to Back"
            >
              <ChevronsDown />
            </Button>
          </div>
        </div>

        {/* Text-specific properties */}
        {element.type === 'text' && (
          <>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={element.content || ''}
                onChange={(e) =>
                  updateElement(element.id, { content: e.target.value })
                }
                className="mt-1"
                dir={isRTLText(element.content) ? 'rtl' : 'ltr'}
              />
            </div>

            <div>
              <Label htmlFor="fontFamily">Font Family</Label>
              <Select
                value={element.fontFamily || 'Arial'}
                onValueChange={(value) =>
                  updateElement(element.id, { fontFamily: value })
                }
              >
                <SelectTrigger id="fontFamily" className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">
                    Times New Roman
                  </SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Palatino">Palatino</SelectItem>
                  <SelectItem value="Garamond">Garamond</SelectItem>
                  <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                  <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
                  <SelectItem value="Impact">Impact</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                  <SelectItem value="Lato">Lato</SelectItem>
                  <SelectItem value="Montserrat">Montserrat</SelectItem>
                  <SelectItem value="Poppins">Poppins</SelectItem>
                  <SelectItem value="Inter">Inter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fontSize">Font Size</Label>
              <Input
                id="fontSize"
                type="number"
                min={8}
                max={200}
                value={element.fontSize || 16}
                onChange={(e) =>
                  updateElement(element.id, {
                    fontSize: Number(e.target.value),
                  })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="fontColor">Font Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="fontColor"
                  type="color"
                  value={element.fontColor || '#000000'}
                  onChange={(e) =>
                    updateElement(element.id, { fontColor: e.target.value })
                  }
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={element.fontColor || '#000000'}
                  onChange={(e) =>
                    updateElement(element.id, { fontColor: e.target.value })
                  }
                  placeholder="#000000"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Text Format</Label>
              <div className="flex gap-2">
                <Button
                  variant={
                    element.fontWeight === 'bold' ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() =>
                    updateElement(element.id, {
                      fontWeight:
                        element.fontWeight === 'bold' ? 'normal' : 'bold',
                    })
                  }
                  title="Bold"
                >
                  <Bold />
                </Button>
                <Button
                  variant={
                    element.fontStyle === 'italic' ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() =>
                    updateElement(element.id, {
                      fontStyle:
                        element.fontStyle === 'italic' ? 'normal' : 'italic',
                    })
                  }
                  title="Italic"
                >
                  <Italic />
                </Button>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Text Align</Label>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant={element.textAlign === 'left' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    updateElement(element.id, { textAlign: 'left' })
                  }
                >
                  <AlignLeft />
                </Button>
                <Button
                  variant={
                    element.textAlign === 'center' ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() =>
                    updateElement(element.id, { textAlign: 'center' })
                  }
                >
                  <AlignCenter />
                </Button>
                <Button
                  variant={
                    element.textAlign === 'right' ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() =>
                    updateElement(element.id, { textAlign: 'right' })
                  }
                >
                  <AlignRight />
                </Button>
                <Button
                  variant={
                    element.textAlign === 'justify' ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() =>
                    updateElement(element.id, { textAlign: 'justify' })
                  }
                >
                  <AlignJustify />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Shape-specific properties */}
        {element.type === 'shape' && (
          <>
            <div>
              <Label htmlFor="shapeColor">Fill Color</Label>
              <div className="flex gap-2 mt-1">
                <input
                  id="shapeColor"
                  type="color"
                  value={element.color || '#3b82f6'}
                  onChange={(e) =>
                    updateElement(element.id, { color: e.target.value })
                  }
                  className="size-8"
                />
                <Input
                  type="text"
                  value={element.color || '#3b82f6'}
                  onChange={(e) =>
                    updateElement(element.id, { color: e.target.value })
                  }
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="borderRadius">
                Border Radius: {element.borderRadius || 0}px{' '}
                <RotateCcw
                  onClick={() => updateElement(element.id, { borderRadius: 4 })}
                  className="size-3 ms-auto text-muted-foreground"
                />
              </Label>
              <Slider
                id="borderRadius"
                min={0}
                max={100}
                value={[element.borderRadius || 0]}
                onValueChange={([value]) =>
                  updateElement(element.id, { borderRadius: value })
                }
                className="mt-2"
              />
            </div>
          </>
        )}

        {/* Image-specific properties */}
        {element.type === 'image' && (
          <>
            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={element.imageUrl || ''}
                onChange={(e) =>
                  updateElement(element.id, { imageUrl: e.target.value })
                }
                className="mt-1"
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="imageBorderRadius">
                Border Radius: {element.borderRadius || 0}px
              </Label>
              <Slider
                id="imageBorderRadius"
                min={0}
                max={100}
                value={[element.borderRadius || 0]}
                onValueChange={([value]) =>
                  updateElement(element.id, { borderRadius: value })
                }
                className="mt-2"
              />
              <Input
                type="number"
                min={0}
                max={100}
                value={element.borderRadius || 0}
                onChange={(e) =>
                  updateElement(element.id, {
                    borderRadius: Number(e.target.value),
                  })
                }
                className="mt-2"
              />
            </div>
          </>
        )}

        {/* Delete button */}
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => deleteSelectedElements()}
        >
          <Trash2 />
          Delete
        </Button>
      </div>
    </div>
  )
}
