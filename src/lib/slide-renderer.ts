import { Canvas as FabricCanvas } from 'fabric'
import type { Slide, SlideElement } from '@/types/editor'
import { CANVAS_CONFIG } from '@/constants'
import { createElement } from '@/components/editor/canvas/factories'

/**
 * Render a slide's elements to a temporary canvas and return as data URL
 */
export async function renderSlideToImage(
  slide: Slide,
  scale: number = 2
): Promise<string> {
  // Create a temporary canvas element
  // Important: The canvas element dimensions should match the Fabric canvas dimensions
  // Fabric.js uses these to determine the rendering area
  const canvasElement = document.createElement('canvas')
  canvasElement.width = CANVAS_CONFIG.width
  canvasElement.height = CANVAS_CONFIG.height
  
  // Also set CSS dimensions to ensure proper rendering
  canvasElement.style.width = `${CANVAS_CONFIG.width}px`
  canvasElement.style.height = `${CANVAS_CONFIG.height}px`

  // Create a Fabric.js canvas instance
  // The width/height here define the coordinate system
  const tempCanvas = new FabricCanvas(canvasElement, {
    width: CANVAS_CONFIG.width,
    height: CANVAS_CONFIG.height,
    backgroundColor: '#ffffff',
    selection: false,
    preserveObjectStacking: true,
  })

  try {
    // Render all elements on the temporary canvas
    await renderElementsOnCanvas(tempCanvas, slide.elements)

    // Wait a bit for images to load
    await waitForImages(tempCanvas)

    // Force a final render to ensure everything is drawn
    tempCanvas.renderAll()

    // Verify canvas has content before exporting
    const objects = tempCanvas.getObjects()
    if (objects.length === 0) {
      console.warn('Warning: Canvas has no objects to export')
    }

    // Ensure viewport is reset to show full canvas
    tempCanvas.setViewportTransform([1, 0, 0, 1, 0, 0])
    
    // Convert to data URL with multiplier
    // The multiplier parameter tells Fabric.js to create a temporary canvas
    // at the specified scale and capture the full canvas area
    // This ensures we capture the entire canvas, not just a portion
    const dataURL = tempCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: scale, // Scale factor for higher resolution export
    })

    // Verify the data URL was created successfully
    if (!dataURL || dataURL.length === 0) {
      throw new Error('Failed to generate canvas data URL')
    }

    // Cleanup
    tempCanvas.dispose()

    return dataURL
  } catch (error) {
    tempCanvas.dispose()
    throw error
  }
}

/**
 * Render elements on a canvas
 */
async function renderElementsOnCanvas(
  canvas: FabricCanvas,
  elements: SlideElement[]
): Promise<void> {
  // Clear canvas first
  canvas.clear()
  canvas.backgroundColor = '#ffffff'

  // Create and add each element
  const imagePromises: Promise<void>[] = []
  
  for (const element of elements) {
    try {
      const obj = await createElement(element, canvas)
      canvas.add(obj)
      
      // If it's an image element with a URL, wait for it to load
      if (element.type === 'image' && element.imageUrl) {
        imagePromises.push(waitForImageElement(canvas, element.id))
      }
    } catch (error) {
      console.error(`Failed to render element ${element.id}:`, error)
    }
  }

  canvas.renderAll()
  
  // Wait for all images to load
  await Promise.all(imagePromises)
  canvas.renderAll()
}

/**
 * Wait for a specific image element to load and replace placeholder
 */
function waitForImageElement(
  canvas: FabricCanvas,
  elementId: string
): Promise<void> {
  return new Promise((resolve) => {
    const checkImage = () => {
      const objects = canvas.getObjects()
      const imageObj = objects.find(
        (obj) => obj.get('elementId') === elementId && obj.type === 'image' && !obj.get('isPlaceholder')
      )
      
      if (imageObj) {
        // Image has been loaded and replaced placeholder
        const img = imageObj as any
        if (img.getElement && img.getElement()) {
          const htmlImg = img.getElement()
          if (htmlImg.complete && htmlImg.naturalWidth > 0) {
            resolve()
            return
          }
        }
      }
      
      // Check again after a short delay
      setTimeout(checkImage, 50)
    }
    
    // Start checking
    checkImage()
    
    // Fallback timeout
    setTimeout(() => resolve(), 3000)
  })
}

/**
 * Wait for all images on the canvas to load
 * This is a fallback to ensure all images are rendered
 */
function waitForImages(canvas: FabricCanvas): Promise<void> {
  return new Promise((resolve) => {
    const objects = canvas.getObjects()
    const imageObjects = objects.filter(
      (obj) => obj.type === 'image' && !obj.get('isPlaceholder')
    )

    if (imageObjects.length === 0) {
      resolve()
      return
    }

    let loadedCount = 0
    const totalImages = imageObjects.length

    const checkComplete = () => {
      loadedCount++
      if (loadedCount >= totalImages) {
        // Give a small delay to ensure rendering is complete
        setTimeout(() => {
          canvas.renderAll()
          resolve()
        }, 100)
      }
    }

    // Check if images are already loaded
    imageObjects.forEach((obj: any) => {
      if (obj.getElement && obj.getElement()) {
        const img = obj.getElement()
        if (img.complete && img.naturalWidth > 0) {
          checkComplete()
        } else {
          img.onload = checkComplete
          img.onerror = checkComplete // Continue even if image fails to load
        }
      } else {
        checkComplete() // Not an image or already loaded
      }
    })

    // Fallback timeout
    setTimeout(() => {
      canvas.renderAll()
      resolve()
    }, 2000)
  })
}

