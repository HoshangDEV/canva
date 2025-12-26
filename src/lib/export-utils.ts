import { jsPDF } from 'jspdf'
import type { Canvas as FabricCanvas } from 'fabric'
import { CANVAS_CONFIG } from '@/constants'

/**
 * Convert a Fabric.js canvas to a data URL (PNG image)
 */
export async function canvasToDataURL(
  canvas: FabricCanvas,
  scale: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary canvas with the desired scale
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: scale,
      })
      resolve(dataURL)
    } catch (error) {
      reject(error)
    }
  })
}


/**
 * Export canvas as PDF
 * @param canvas - The Fabric.js canvas instance
 * @param filename - Optional filename (default: 'canvas-export.pdf')
 */
export async function exportAsPDF(
  canvas: FabricCanvas,
  filename: string = 'canvas-export.pdf'
): Promise<void> {
  try {
    // Convert canvas to image
    const dataURL = await canvasToDataURL(canvas, 2) // Higher quality for PDF
    
    // Create PDF with canvas dimensions (in points, 1 inch = 72 points)
    // Convert pixels to inches (assuming 96 DPI)
    const widthInches = CANVAS_CONFIG.width / 96
    const heightInches = CANVAS_CONFIG.height / 96
    
    const pdf = new jsPDF({
      orientation: widthInches > heightInches ? 'landscape' : 'portrait',
      unit: 'in',
      format: [widthInches, heightInches],
    })

    // Add image to PDF
    pdf.addImage(dataURL, 'PNG', 0, 0, widthInches, heightInches)
    
    // Save PDF
    pdf.save(filename)
  } catch (error) {
    console.error('Error exporting PDF:', error)
    throw new Error('Failed to export PDF')
  }
}


