import { useEditorStore } from '@/store/editor-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Trash2,
  Bold,
  Italic,
} from 'lucide-react'
import { isRTLText } from '@/lib/utils'

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
    selectedElementIds.includes(el.id)
  )

  if (selectedElements.length === 0) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4">
        <p className="text-sm text-gray-500">Select an element to edit</p>
      </div>
    )
  }

  if (selectedElements.length > 1) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">{selectedElements.length} Elements</h3>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Alignment</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignElements('left')}
                title="Left"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignElements('center-h')}
                title="Center Horizontal"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignElements('right')}
                title="Right"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignElements('top')}
                title="Top"
              >
                <AlignVerticalJustifyStart className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignElements('center-v')}
                title="Center Vertical"
              >
                <AlignVerticalJustifyCenter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignElements('bottom')}
                title="Bottom"
              >
                <AlignVerticalJustifyEnd className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Arrange</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={bringToFront}
                title="Bring to Front"
              >
                <ArrowUp className="h-4 w-4 mr-1" />
                Front
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={bringForward}
                title="Bring Forward"
              >
                <ArrowUpDown className="h-4 w-4 mr-1" />
                Forward
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={sendBackward}
                title="Send Backward"
              >
                <ArrowDown className="h-4 w-4 mr-1" />
                Backward
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={sendToBack}
                title="Send to Back"
              >
                <ArrowDown className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>
          </div>

          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={deleteSelectedElements}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      </div>
    )
  }

  const element = selectedElements[0]

  return (
    <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4 capitalize">{element.type} Properties</h3>

      <div className="space-y-4">
        {/* Common Properties */}
        <div className="grid grid-cols-2 gap-2">
          <div>
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
          <div>
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
          <div>
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
          <div>
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
            Rotation: {Math.round(element.rotation)}°
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
          <Input
            type="number"
            value={Math.round(element.rotation)}
            onChange={(e) =>
              updateElement(element.id, { rotation: Number(e.target.value) })
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
              onClick={() => alignElements('left')}
              title="Left"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignElements('center-h')}
              title="Center Horizontal"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignElements('right')}
              title="Right"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignElements('top')}
              title="Top"
            >
              <AlignVerticalJustifyStart className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignElements('center-v')}
              title="Center Vertical"
            >
              <AlignVerticalJustifyCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alignElements('bottom')}
              title="Bottom"
            >
              <AlignVerticalJustifyEnd className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Arrange */}
        <div>
          <Label className="mb-2 block">Arrange</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={bringToFront}
              title="Bring to Front"
            >
              <ArrowUp className="h-4 w-4 mr-1" />
              Front
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={bringForward}
              title="Bring Forward"
            >
              <ArrowUpDown className="h-4 w-4 mr-1" />
              Forward
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={sendBackward}
              title="Send Backward"
            >
              <ArrowDown className="h-4 w-4 mr-1" />
              Backward
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={sendToBack}
              title="Send to Back"
            >
              <ArrowDown className="h-4 w-4 mr-1" />
              Back
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
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
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
                  variant={element.fontWeight === 'bold' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    updateElement(element.id, {
                      fontWeight:
                        element.fontWeight === 'bold' ? 'normal' : 'bold',
                    })
                  }
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant={element.fontStyle === 'italic' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    updateElement(element.id, {
                      fontStyle:
                        element.fontStyle === 'italic' ? 'normal' : 'italic',
                    })
                  }
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
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
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant={element.textAlign === 'center' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    updateElement(element.id, { textAlign: 'center' })
                  }
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant={element.textAlign === 'right' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    updateElement(element.id, { textAlign: 'right' })
                  }
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
                <Button
                  variant={element.textAlign === 'justify' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    updateElement(element.id, { textAlign: 'justify' })
                  }
                >
                  <AlignJustify className="h-4 w-4" />
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
                <Input
                  id="shapeColor"
                  type="color"
                  value={element.color || '#3b82f6'}
                  onChange={(e) =>
                    updateElement(element.id, { color: e.target.value })
                  }
                  className="w-16 h-10"
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
                Border Radius: {element.borderRadius || 0}px
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
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  )
}

