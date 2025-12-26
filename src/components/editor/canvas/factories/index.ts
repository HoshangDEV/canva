import {
  Canvas as FabricCanvas,
  Textbox,
  Rect,
  Image as FabricImage,
  FabricObject,
} from 'fabric'
import type { SlideElement, ElementType } from '@/types/editor'
import { isRTLText } from '@/lib/utils'

export type ElementFactory = (
  element: SlideElement,
  canvas: FabricCanvas
) => Promise<FabricObject>

/**
 * Create a Fabric.js Textbox from a text element
 */
export async function createTextElement(element: SlideElement): Promise<FabricObject> {
  const direction = element.textDirection || (isRTLText(element.content) ? 'rtl' : 'ltr')

  const text = new Textbox(element.content || 'Text', {
    left: element.x,
    top: element.y,
    width: element.width,
    angle: element.rotation || 0,
    fontSize: element.fontSize || 16,
    fill: element.fontColor || '#000000',
    fontFamily: element.fontFamily || 'Arial',
    fontWeight: element.fontWeight || 'normal',
    fontStyle: element.fontStyle || 'normal',
    textAlign: element.textAlign || 'left',
    direction: direction,
  })

  text.set('elementId', element.id)
  return text
}

/**
 * Create a Fabric.js Rect from a shape element
 */
export async function createShapeElement(element: SlideElement): Promise<FabricObject> {
  const rect = new Rect({
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    angle: element.rotation || 0,
    fill: element.color || '#3b82f6',
    rx: element.borderRadius || 4,
    ry: element.borderRadius || 4,
  })

  rect.set('elementId', element.id)
  return rect
}

/**
 * Create a Fabric.js Image from an image element
 * Returns a placeholder rect that gets replaced when the image loads
 */
export async function createImageElement(
  element: SlideElement,
  canvas: FabricCanvas
): Promise<FabricObject> {
  // Create placeholder immediately
  const placeholder = new Rect({
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    angle: element.rotation || 0,
    fill: '#e5e7eb',
    stroke: '#9ca3af',
    strokeWidth: 1,
    rx: element.borderRadius || 0,
    ry: element.borderRadius || 0,
  })

  placeholder.set('elementId', element.id)
  placeholder.set('isPlaceholder', true)

  // If no URL, return placeholder
  if (!element.imageUrl) {
    return placeholder
  }

  // Load image asynchronously and replace placeholder
  loadImageAsync(element, canvas)

  return placeholder
}

/**
 * Async image loading - replaces placeholder when done
 */
async function loadImageAsync(
  element: SlideElement,
  canvas: FabricCanvas
): Promise<void> {
  try {
    const img = await FabricImage.fromURL(element.imageUrl!, {
      crossOrigin: 'anonymous',
    })

    img.set({
      left: element.x,
      top: element.y,
      scaleX: element.width / (img.width || element.width),
      scaleY: element.height / (img.height || element.height),
      angle: element.rotation || 0,
    })

    // Apply border radius using clipPath if needed
    if (element.borderRadius && element.borderRadius > 0) {
      const clipPath = new Rect({
        width: element.width,
        height: element.height,
        rx: element.borderRadius,
        ry: element.borderRadius,
        left: -element.width / 2,
        top: -element.height / 2,
      })
      img.set({ clipPath })
    }

    img.set('elementId', element.id)

    // Find and replace placeholder in canvas
    const objects = canvas.getObjects()
    const placeholderObj = objects.find(
      (obj) => obj.get('elementId') === element.id && obj.get('isPlaceholder')
    )

    if (placeholderObj) {
      canvas.remove(placeholderObj)
      canvas.add(img)
      canvas.renderAll()
    }
  } catch (error) {
    console.error('Failed to load image:', error)
    // Placeholder remains visible on error
  }
}

/**
 * Factory registry - maps element types to their factory functions
 */
const factories: Record<ElementType, ElementFactory> = {
  text: createTextElement,
  shape: createShapeElement,
  image: createImageElement,
}

/**
 * Create a Fabric.js object from a SlideElement
 */
export async function createElement(
  element: SlideElement,
  canvas: FabricCanvas
): Promise<FabricObject> {
  const factory = factories[element.type]
  if (!factory) {
    throw new Error(`Unknown element type: ${element.type}`)
  }
  return factory(element, canvas)
}

/**
 * Update properties on an existing Fabric object without recreating it
 * Returns true if update was successful, false if object needs recreation
 */
export function updateFabricObject(
  obj: FabricObject,
  element: SlideElement
): boolean {
  const type = element.type

  // Common properties
  obj.set({
    left: element.x,
    top: element.y,
    angle: element.rotation || 0,
  })

  if (type === 'text' && obj.type === 'textbox') {
    const textbox = obj as Textbox
    const direction = element.textDirection || (isRTLText(element.content) ? 'rtl' : 'ltr')

    textbox.set({
      width: element.width,
      text: element.content || 'Text',
      fontSize: element.fontSize || 16,
      fill: element.fontColor || '#000000',
      fontFamily: element.fontFamily || 'Arial',
      fontWeight: element.fontWeight || 'normal',
      fontStyle: element.fontStyle || 'normal',
      textAlign: element.textAlign || 'left',
      direction: direction,
    })
    return true
  }

  if (type === 'shape' && obj.type === 'rect') {
    const rect = obj as Rect
    rect.set({
      width: element.width,
      height: element.height,
      fill: element.color || '#3b82f6',
      rx: element.borderRadius || 4,
      ry: element.borderRadius || 4,
    })
    return true
  }

  if (type === 'image') {
    // Images are complex - if URL changed, need recreation
    // For position/size updates, we can update in place
    if (obj.type === 'image') {
      const img = obj as FabricImage
      img.set({
        scaleX: element.width / (img.width || element.width),
        scaleY: element.height / (img.height || element.height),
      })

      // Update clipPath for border radius
      if (element.borderRadius && element.borderRadius > 0) {
        const clipPath = new Rect({
          width: element.width,
          height: element.height,
          rx: element.borderRadius,
          ry: element.borderRadius,
          left: -element.width / 2,
          top: -element.height / 2,
        })
        img.set({ clipPath })
      } else {
        img.set({ clipPath: undefined })
      }
      return true
    }
    // If it's still a placeholder rect, keep it
    return true
  }

  return false
}
