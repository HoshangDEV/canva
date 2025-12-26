import { createServerFn } from '@tanstack/react-start'
import { jsPDF } from 'jspdf'
import pptxgen from 'pptxgenjs'
import { CANVAS_CONFIG } from '@/constants'

/**
 * Export slides as PDF
 * Receives base64 image data URLs for each slide
 */
export const exportSlidesAsPDF = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { slideImages: string[]; filename?: string }) => data
  )
  .handler(async ({ data }) => {
    const { slideImages, filename = 'presentation.pdf' } = data

    if (!slideImages || slideImages.length === 0) {
      throw new Error('No slide images provided')
    }

    // Convert pixels to inches (assuming 96 DPI)
    const widthInches = CANVAS_CONFIG.width / 96
    const heightInches = CANVAS_CONFIG.height / 96

    const pdf = new jsPDF({
      orientation: widthInches > heightInches ? 'landscape' : 'portrait',
      unit: 'in',
      format: [widthInches, heightInches],
    })

    // Add each slide as a page
    for (let i = 0; i < slideImages.length; i++) {
      if (i > 0) {
        pdf.addPage(
          [widthInches, heightInches],
          widthInches > heightInches ? 'landscape' : 'portrait'
        )
      }

      pdf.addImage(slideImages[i], 'PNG', 0, 0, widthInches, heightInches)
    }

    // Convert PDF to base64
    const pdfBlob = pdf.output('blob')
    const arrayBuffer = await pdfBlob.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const dataUrl = `data:application/pdf;base64,${base64}`

    return { dataUrl, filename }
  })

/**
 * Export slides as PPTX (PowerPoint)
 * Receives slide data and creates editable PowerPoint elements
 */
export const exportSlidesAsPPTX = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { slides: Array<{ elements: Array<any> }>; filename?: string }) => data
  )
  .handler(async ({ data }) => {
    const { slides, filename = 'presentation.pptx' } = data

    if (!slides || slides.length === 0) {
      throw new Error('No slides provided')
    }

    const pptx = new pptxgen()

    // Set slide dimensions (in inches)
    const widthInches = CANVAS_CONFIG.width / 96
    const heightInches = CANVAS_CONFIG.height / 96

    // Define custom layout
    pptx.defineLayout({
      name: 'CUSTOM',
      width: widthInches,
      height: heightInches,
    })
    pptx.layout = 'CUSTOM' as any

    // Convert pixels to inches (96 DPI)
    const pxToInches = (px: number) => px / 96

    // Add each slide with editable elements
    for (const slideData of slides) {
      const slide = pptx.addSlide()

      // Process elements in reverse order to maintain z-index (last element on top)
      const sortedElements = [...slideData.elements].reverse()

      for (const element of sortedElements) {
        // Fabric.js uses center-based coordinates, PowerPoint uses top-left
        // Convert from center (x, y) to top-left (x - width/2, y - height/2)
        const centerX = element.x || 0
        const centerY = element.y || 0
        const width = element.width || 0
        const height = element.height || 0
        
        const topLeftX = centerX - width / 2
        const topLeftY = centerY - height / 2
        
        const x = pxToInches(Math.max(0, topLeftX))
        const y = pxToInches(Math.max(0, topLeftY))
        const w = pxToInches(width)
        const h = pxToInches(height)
        const rotation = element.rotation || 0

        if (element.type === 'text') {
          // Add editable text
          // Convert font size from pixels to points (1 pixel ≈ 0.75 points at 96 DPI)
          const fontSizePt = (element.fontSize || 16) * 0.75
          
          // Convert color from hex (#RRGGBB) to format PowerPoint expects (RRGGBB or hex)
          const color = (element.fontColor || '#000000').replace('#', '')
          
          const textOptions: any = {
            x: x,
            y: y,
            w: w,
            h: h,
            fontSize: Math.round(fontSizePt),
            color: color,
            fontFace: element.fontFamily || 'Arial',
            bold: element.fontWeight === 'bold',
            italic: element.fontStyle === 'italic',
            align: element.textAlign === 'justify' ? 'left' : (element.textAlign || 'left'),
            valign: 'middle',
            rotate: rotation,
          }

          // Handle RTL text direction
          if (element.textDirection === 'rtl') {
            textOptions.rtlMode = true
          }

          slide.addText(element.content || 'Text', textOptions)
        } else if (element.type === 'shape') {
          // Add editable shape (rectangle)
          // Convert color from hex (#RRGGBB) to format PowerPoint expects (RRGGBB)
          const shapeColor = (element.color || '#3b82f6').replace('#', '')
          
          const shapeOptions: any = {
            x: x,
            y: y,
            w: w,
            h: h,
            fill: { color: shapeColor },
            line: { color: '000000', width: 0 },
            rotate: rotation,
          }

          // Add rounded corners if borderRadius is set
          if (element.borderRadius && element.borderRadius > 0) {
            // pptxgenjs uses rectRadius for rounded rectangles
            const radiusRatio = Math.min(element.borderRadius / Math.min(w * 96, h * 96), 0.5)
            shapeOptions.rectRadius = radiusRatio
            slide.addShape(pptx.ShapeType.roundRect, shapeOptions)
          } else {
            slide.addShape(pptx.ShapeType.rect, shapeOptions)
          }
        } else if (element.type === 'image' && element.imageUrl) {
          // Add image (images remain as images, not editable)
          const imageOptions: any = {
            x: x,
            y: y,
            w: w,
            h: h,
            rotate: rotation,
          }

          // Handle base64 data URLs or regular URLs
          if (element.imageUrl.startsWith('data:')) {
            imageOptions.data = element.imageUrl
          } else {
            imageOptions.path = element.imageUrl
          }

          // Add border radius if specified (using rounding option)
          if (element.borderRadius && element.borderRadius > 0) {
            imageOptions.rounding = true
          }

          slide.addImage(imageOptions)
        }
      }
    }

    // Generate PPTX - pptxgenjs write() with outputType: 'base64' returns a Promise<string>
    const base64String = await pptx.write({ outputType: 'base64' })
    const dataUrl = `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${base64String}`

    return { dataUrl, filename }
  })

