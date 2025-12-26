import { create } from 'zustand'
import type {
  Slide,
  SlideElement,
  AlignmentType,
  XAxisAlignmentType,
  YAxisAlignmentType,
  EditorStateSnapshot,
  EditorExportData,
} from '@/types/editor'
import { CANVAS_CONFIG } from '@/constants'
import type { Canvas as FabricCanvas } from 'fabric'
import { exportAsPDF } from '@/lib/export-utils'
import { renderSlideToImage } from '@/lib/slide-renderer'
import { exportSlidesAsPDF, exportSlidesAsPPTX } from '@/server/export'

interface EditorState {
  slides: Slide[]
  currentSlideIndex: number
  selectedElementIds: string[]
  history: EditorStateSnapshot[]
  historyIndex: number
  maxHistorySize: number
  zoom: number
  activePanel: 'slides' | 'layers'
  canvasRef: FabricCanvas | null

  // Actions
  setSlides: (slides: Slide[]) => void
  setCurrentSlide: (index: number) => void
  selectElement: (id: string | null, addToSelection?: boolean) => void
  addElement: (element: Omit<SlideElement, 'id'>) => void
  updateElement: (id: string, updates: Partial<SlideElement>) => void
  updateElements: (updates: { id: string; changes: Partial<SlideElement> }[]) => void
  deleteElement: (id: string) => void
  deleteSelectedElements: () => void
  duplicateElement: (id: string) => void
  duplicateSelectedElements: () => void
  addSlide: () => void
  deleteSlide: (index: number) => void
  duplicateSlide: (index: number) => void
  alignElements: (alignment: AlignmentType) => void
  alignElementsX: (alignment: XAxisAlignmentType) => void
  alignElementsY: (alignment: YAxisAlignmentType) => void
  bringToFront: () => void
  sendToBack: () => void
  bringForward: () => void
  sendBackward: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  saveSnapshot: () => void
  setZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  setActivePanel: (panel: 'slides' | 'layers') => void
  exportCanvas: () => void
  importCanvas: (data: EditorExportData) => void
  setCanvasRef: (canvas: FabricCanvas | null) => void
  exportCurrentSlideAsPDF: () => Promise<void>
  exportAllSlidesAsPDF: () => Promise<void>
  exportAllSlidesAsPPTX: () => Promise<void>
}

export const useEditorStore = create<EditorState>((set, get) => ({
  slides: [
    {
      id: 'slide-1',
      elements: [],
    },
  ],
  currentSlideIndex: 0,
  selectedElementIds: [],
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,
  zoom: 1,
  activePanel: 'slides',
  canvasRef: null,

  setSlides: (slides) => {
    set({ slides })
    get().saveSnapshot()
  },

  setCurrentSlide: (index) => {
    set({ currentSlideIndex: index, selectedElementIds: [] })
  },

  selectElement: (id, addToSelection = false) => {
    if (id === null) {
      set({ selectedElementIds: [] })
      return
    }

    if (addToSelection) {
      set((state) => ({
        selectedElementIds: state.selectedElementIds.includes(id)
          ? state.selectedElementIds
          : [...state.selectedElementIds, id],
      }))
    } else {
      set({ selectedElementIds: [id] })
    }
  },

  addElement: (element) => {
    const newElement: SlideElement = {
      ...element,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }

    set((state) => {
      const slides = [...state.slides]
      const currentSlide = { ...slides[state.currentSlideIndex] }
      currentSlide.elements = [...currentSlide.elements, newElement]
      slides[state.currentSlideIndex] = currentSlide

      return {
        slides,
        selectedElementIds: [newElement.id],
      }
    })

    get().saveSnapshot()
  },

  updateElement: (id, updates) => {
    set((state) => {
      const slides = state.slides.map((slide) => ({
        ...slide,
        elements: slide.elements.map((el) =>
          el.id === id ? { ...el, ...updates } : el
        ),
      }))

      return { slides }
    })
  },

  updateElements: (updates) => {
    set((state) => {
      const updateMap = new Map(updates.map((u) => [u.id, u.changes]))

      const slides = state.slides.map((slide) => ({
        ...slide,
        elements: slide.elements.map((el) =>
          updateMap.has(el.id) ? { ...el, ...updateMap.get(el.id) } : el
        ),
      }))

      return { slides }
    })
  },

  deleteElement: (id) => {
    set((state) => {
      const slides = state.slides.map((slide) => ({
        ...slide,
        elements: slide.elements.filter((el) => el.id !== id),
      }))

      return {
        slides,
        selectedElementIds: state.selectedElementIds.filter((eid) => eid !== id),
      }
    })

    get().saveSnapshot()
  },

  deleteSelectedElements: () => {
    const { selectedElementIds } = get()
    selectedElementIds.forEach((id) => get().deleteElement(id))
  },

  duplicateElement: (id) => {
    const state = get()
    const currentSlide = state.slides[state.currentSlideIndex]
    const element = currentSlide.elements.find((el) => el.id === id)

    if (!element) return

    // Create a deep copy of the element with a new ID
    const duplicatedElement: SlideElement = {
      ...element,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      // Offset position by 20px so it's visible
      x: element.x + 20,
      y: element.y + 20,
    }

    set((state) => {
      const slides = [...state.slides]
      const currentSlide = { ...slides[state.currentSlideIndex] }
      // Find the index of the original element and insert duplicate right after it
      const originalIndex = currentSlide.elements.findIndex((el) => el.id === id)
      const insertIndex = originalIndex !== -1 ? originalIndex + 1 : currentSlide.elements.length
      currentSlide.elements = [
        ...currentSlide.elements.slice(0, insertIndex),
        duplicatedElement,
        ...currentSlide.elements.slice(insertIndex),
      ]
      slides[state.currentSlideIndex] = currentSlide

      return {
        slides,
        selectedElementIds: [duplicatedElement.id],
      }
    })

    get().saveSnapshot()
  },

  duplicateSelectedElements: () => {
    const { selectedElementIds } = get()
    if (selectedElementIds.length === 0) return

    const state = get()
    const currentSlide = state.slides[state.currentSlideIndex]
    const selectedElements = currentSlide.elements.filter((el) =>
      selectedElementIds.includes(el.id)
    )

    if (selectedElements.length === 0) return

    // Create duplicates with new IDs and offset positions
    const duplicatedElements: SlideElement[] = selectedElements.map((element) => ({
      ...element,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: element.x + 20,
      y: element.y + 20,
    }))

    set((state) => {
      const slides = [...state.slides]
      const currentSlide = { ...slides[state.currentSlideIndex] }
      // Find the highest index of selected elements and insert duplicates after
      const maxIndex = Math.max(
        ...selectedElements.map((el) =>
          currentSlide.elements.findIndex((e) => e.id === el.id)
        )
      )
      const insertIndex = maxIndex !== -1 ? maxIndex + 1 : currentSlide.elements.length
      currentSlide.elements = [
        ...currentSlide.elements.slice(0, insertIndex),
        ...duplicatedElements,
        ...currentSlide.elements.slice(insertIndex),
      ]
      slides[state.currentSlideIndex] = currentSlide

      return {
        slides,
        selectedElementIds: duplicatedElements.map((el) => el.id),
      }
    })

    get().saveSnapshot()
  },

  addSlide: () => {
    set((state) => {
      const newSlide: Slide = {
        id: `slide-${Date.now()}`,
        elements: [],
      }

      return {
        slides: [...state.slides, newSlide],
        currentSlideIndex: state.slides.length,
        selectedElementIds: [],
      }
    })

    get().saveSnapshot()
  },

  deleteSlide: (index) => {
    set((state) => {
      if (state.slides.length <= 1) return state

      const slides = state.slides.filter((_, i) => i !== index)
      const newIndex = Math.min(
        state.currentSlideIndex,
        slides.length - 1
      )

      return {
        slides,
        currentSlideIndex: newIndex,
        selectedElementIds: [],
      }
    })

    get().saveSnapshot()
  },

  duplicateSlide: (index) => {
    const state = get()
    const slideToDuplicate = state.slides[index]

    if (!slideToDuplicate) return

    // Create a deep copy of the slide with new IDs for all elements
    const duplicatedSlide: Slide = {
      id: `slide-${Date.now()}`,
      elements: slideToDuplicate.elements.map((element) => ({
        ...element,
        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      })),
    }

    set((state) => {
      const slides = [...state.slides]
      // Insert duplicate slide right after the original
      slides.splice(index + 1, 0, duplicatedSlide)

      return {
        slides,
        currentSlideIndex: index + 1,
        selectedElementIds: [],
      }
    })

    get().saveSnapshot()
  },

  alignElements: (alignment) => {
    const { selectedElementIds } = get()
    if (selectedElementIds.length === 0) return

    const state = get()
    const currentSlide = state.slides[state.currentSlideIndex]
    const selectedElements = currentSlide.elements.filter((el) =>
      selectedElementIds.includes(el.id)
    )

    if (selectedElements.length === 0) return

    const updates: { id: string; changes: Partial<SlideElement> }[] = []

    selectedElements.forEach((element) => {
      // Fabric.js uses the center of the element as the origin for left/top
      // So element.x and element.y represent the center position, not top-left
      const rotation = element.rotation || 0
      const radians = (rotation * Math.PI) / 180

      // Element dimensions
      const width = element.width
      const height = element.height
      const halfWidth = width / 2
      const halfHeight = height / 2

      // Current center position (element.x and element.y are the center)
      const centerX = element.x
      const centerY = element.y

      // Calculate the corners of the unrotated rectangle relative to center
      const corners = [
        { x: -halfWidth, y: -halfHeight }, // top-left
        { x: halfWidth, y: -halfHeight },  // top-right
        { x: halfWidth, y: halfHeight },    // bottom-right
        { x: -halfWidth, y: halfHeight },   // bottom-left
      ]

      // Rotate corners around center
      const cos = Math.cos(radians)
      const sin = Math.sin(radians)
      const rotatedCorners = corners.map(corner => ({
        x: centerX + (corner.x * cos - corner.y * sin),
        y: centerY + (corner.x * sin + corner.y * cos),
      }))

      // Find bounding box of rotated element
      const minX = Math.min(...rotatedCorners.map(c => c.x))
      const maxX = Math.max(...rotatedCorners.map(c => c.x))
      const minY = Math.min(...rotatedCorners.map(c => c.y))
      const maxY = Math.max(...rotatedCorners.map(c => c.y))

      // Calculate how far the bounding box extends from the center
      // This tells us how much we need to offset the center to align the bounding box edge
      const leftOffset = centerX - minX   // Distance from center to left edge of bounding box
      const rightOffset = maxX - centerX   // Distance from center to right edge of bounding box
      const topOffset = centerY - minY     // Distance from center to top edge of bounding box
      const bottomOffset = maxY - centerY  // Distance from center to bottom edge of bounding box

      let newX = element.x
      let newY = element.y

      switch (alignment) {
        case 'top-left':
          // Position center so that top-left corner of bounding box is at (0, 0)
          newX = leftOffset
          newY = topOffset
          break
        case 'top-center':
          // Position center so that top edge is at y=0 and horizontally centered
          newX = CANVAS_CONFIG.width / 2
          newY = topOffset
          break
        case 'top-right':
          // Position center so that top-right corner of bounding box is at (canvas_width, 0)
          newX = CANVAS_CONFIG.width - rightOffset
          newY = topOffset
          break
        case 'mid-left':
          // Position center so that left edge is at x=0 and vertically centered
          newX = leftOffset
          newY = CANVAS_CONFIG.height / 2
          break
        case 'mid-center':
          // Position center at canvas center
          newX = CANVAS_CONFIG.width / 2
          newY = CANVAS_CONFIG.height / 2
          break
        case 'mid-right':
          // Position center so that right edge is at x=canvas_width and vertically centered
          newX = CANVAS_CONFIG.width - rightOffset
          newY = CANVAS_CONFIG.height / 2
          break
        case 'bottom-left':
          // Position center so that bottom-left corner of bounding box is at (0, canvas_height)
          newX = leftOffset
          newY = CANVAS_CONFIG.height - bottomOffset
          break
        case 'bottom-center':
          // Position center so that bottom edge is at y=canvas_height and horizontally centered
          newX = CANVAS_CONFIG.width / 2
          newY = CANVAS_CONFIG.height - bottomOffset
          break
        case 'bottom-right':
          // Position center so that bottom-right corner of bounding box is at (canvas_width, canvas_height)
          newX = CANVAS_CONFIG.width - rightOffset
          newY = CANVAS_CONFIG.height - bottomOffset
          break
      }

      // Round to avoid floating point precision issues
      updates.push({ 
        id: element.id, 
        changes: { 
          x: Math.round(newX * 100) / 100,
          y: Math.round(newY * 100) / 100,
        } 
      })
    })

    get().updateElements(updates)
    get().saveSnapshot()
  },

  alignElementsX: (alignment) => {
    const { selectedElementIds } = get()
    if (selectedElementIds.length === 0) return

    const state = get()
    const currentSlide = state.slides[state.currentSlideIndex]
    const selectedElements = currentSlide.elements.filter((el) =>
      selectedElementIds.includes(el.id)
    )

    if (selectedElements.length === 0) return

    const updates: { id: string; changes: Partial<SlideElement> }[] = []

    selectedElements.forEach((element) => {
      const rotation = element.rotation || 0
      const radians = (rotation * Math.PI) / 180

      const width = element.width
      const height = element.height
      const halfWidth = width / 2
      const halfHeight = height / 2

      const centerX = element.x
      const centerY = element.y

      const corners = [
        { x: -halfWidth, y: -halfHeight },
        { x: halfWidth, y: -halfHeight },
        { x: halfWidth, y: halfHeight },
        { x: -halfWidth, y: halfHeight },
      ]

      const cos = Math.cos(radians)
      const sin = Math.sin(radians)
      const rotatedCorners = corners.map(corner => ({
        x: centerX + (corner.x * cos - corner.y * sin),
        y: centerY + (corner.x * sin + corner.y * cos),
      }))

      const minX = Math.min(...rotatedCorners.map(c => c.x))
      const maxX = Math.max(...rotatedCorners.map(c => c.x))

      const leftOffset = centerX - minX
      const rightOffset = maxX - centerX

      let newX = element.x

      switch (alignment) {
        case 'left':
          newX = leftOffset
          break
        case 'center':
          newX = CANVAS_CONFIG.width / 2
          break
        case 'right':
          newX = CANVAS_CONFIG.width - rightOffset
          break
      }

      updates.push({ 
        id: element.id, 
        changes: { 
          x: Math.round(newX * 100) / 100,
        } 
      })
    })

    get().updateElements(updates)
    get().saveSnapshot()
  },

  alignElementsY: (alignment) => {
    const { selectedElementIds } = get()
    if (selectedElementIds.length === 0) return

    const state = get()
    const currentSlide = state.slides[state.currentSlideIndex]
    const selectedElements = currentSlide.elements.filter((el) =>
      selectedElementIds.includes(el.id)
    )

    if (selectedElements.length === 0) return

    const updates: { id: string; changes: Partial<SlideElement> }[] = []

    selectedElements.forEach((element) => {
      const rotation = element.rotation || 0
      const radians = (rotation * Math.PI) / 180

      const width = element.width
      const height = element.height
      const halfWidth = width / 2
      const halfHeight = height / 2

      const centerX = element.x
      const centerY = element.y

      const corners = [
        { x: -halfWidth, y: -halfHeight },
        { x: halfWidth, y: -halfHeight },
        { x: halfWidth, y: halfHeight },
        { x: -halfWidth, y: halfHeight },
      ]

      const cos = Math.cos(radians)
      const sin = Math.sin(radians)
      const rotatedCorners = corners.map(corner => ({
        x: centerX + (corner.x * cos - corner.y * sin),
        y: centerY + (corner.x * sin + corner.y * cos),
      }))

      const minY = Math.min(...rotatedCorners.map(c => c.y))
      const maxY = Math.max(...rotatedCorners.map(c => c.y))

      const topOffset = centerY - minY
      const bottomOffset = maxY - centerY

      let newY = element.y

      switch (alignment) {
        case 'top':
          newY = topOffset
          break
        case 'center':
          newY = CANVAS_CONFIG.height / 2
          break
        case 'bottom':
          newY = CANVAS_CONFIG.height - bottomOffset
          break
      }

      updates.push({ 
        id: element.id, 
        changes: { 
          y: Math.round(newY * 100) / 100,
        } 
      })
    })

    get().updateElements(updates)
    get().saveSnapshot()
  },

  bringToFront: () => {
    const { selectedElementIds } = get()
    if (selectedElementIds.length === 0) return

    set((state) => {
      const slides = state.slides.map((slide, idx) => {
        if (idx !== state.currentSlideIndex) return slide

        const selected = slide.elements.filter((el) =>
          selectedElementIds.includes(el.id)
        )
        const unselected = slide.elements.filter(
          (el) => !selectedElementIds.includes(el.id)
        )

        return {
          ...slide,
          elements: [...unselected, ...selected],
        }
      })

      return { slides }
    })

    get().saveSnapshot()
  },

  sendToBack: () => {
    const { selectedElementIds } = get()
    if (selectedElementIds.length === 0) return

    set((state) => {
      const slides = state.slides.map((slide, idx) => {
        if (idx !== state.currentSlideIndex) return slide

        const selected = slide.elements.filter((el) =>
          selectedElementIds.includes(el.id)
        )
        const unselected = slide.elements.filter(
          (el) => !selectedElementIds.includes(el.id)
        )

        return {
          ...slide,
          elements: [...selected, ...unselected],
        }
      })

      return { slides }
    })

    get().saveSnapshot()
  },

  bringForward: () => {
    const { selectedElementIds } = get()
    if (selectedElementIds.length === 0) return

    set((state) => {
      const slides = state.slides.map((slide, idx) => {
        if (idx !== state.currentSlideIndex) return slide

        const elements = [...slide.elements]
        const selectedIndices: number[] = []

        selectedElementIds.forEach((id) => {
          const index = elements.findIndex((el) => el.id === id)
          if (index !== -1 && index < elements.length - 1) {
            selectedIndices.push(index)
          }
        })

        // Move each selected element forward
        selectedIndices
          .sort((a, b) => b - a)
          .forEach((index) => {
            const element = elements[index]
            const nextElement = elements[index + 1]

            if (!selectedElementIds.includes(nextElement.id)) {
              elements[index] = nextElement
              elements[index + 1] = element
            }
          })

        return {
          ...slide,
          elements,
        }
      })

      return { slides }
    })

    get().saveSnapshot()
  },

  sendBackward: () => {
    const { selectedElementIds } = get()
    if (selectedElementIds.length === 0) return

    set((state) => {
      const slides = state.slides.map((slide, idx) => {
        if (idx !== state.currentSlideIndex) return slide

        const elements = [...slide.elements]
        const selectedIndices: number[] = []

        selectedElementIds.forEach((id) => {
          const index = elements.findIndex((el) => el.id === id)
          if (index !== -1 && index > 0) {
            selectedIndices.push(index)
          }
        })

        // Move each selected element backward
        selectedIndices
          .sort((a, b) => a - b)
          .forEach((index) => {
            const element = elements[index]
            const prevElement = elements[index - 1]

            if (!selectedElementIds.includes(prevElement.id)) {
              elements[index] = prevElement
              elements[index - 1] = element
            }
          })

        return {
          ...slide,
          elements,
        }
      })

      return { slides }
    })

    get().saveSnapshot()
  },

  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex <= 0) return

    const snapshot = history[historyIndex - 1]
    set({
      slides: snapshot.slides,
      currentSlideIndex: snapshot.currentSlideIndex,
      selectedElementIds: snapshot.selectedElementIds,
      historyIndex: historyIndex - 1,
    })
  },

  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex >= history.length - 1) return

    const snapshot = history[historyIndex + 1]
    set({
      slides: snapshot.slides,
      currentSlideIndex: snapshot.currentSlideIndex,
      selectedElementIds: snapshot.selectedElementIds,
      historyIndex: historyIndex + 1,
    })
  },

  canUndo: () => {
    return get().historyIndex > 0
  },

  canRedo: () => {
    const { history, historyIndex } = get()
    return historyIndex < history.length - 1
  },

  saveSnapshot: () => {
    const { slides, currentSlideIndex, selectedElementIds, history, historyIndex, maxHistorySize } = get()

    const snapshot: EditorStateSnapshot = {
      slides: JSON.parse(JSON.stringify(slides)), // Deep clone
      currentSlideIndex,
      selectedElementIds: [...selectedElementIds],
    }

    // Remove any history after current index (when undoing then making new changes)
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(snapshot)

    // Limit history size
    if (newHistory.length > maxHistorySize) {
      newHistory.shift()
    } else {
      // Only increment index if we're not at max size
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    })
  },

  setZoom: (zoom) => {
    // Clamp zoom between 0.1 (10%) and 5 (500%)
    const clampedZoom = Math.max(0.1, Math.min(5, zoom))
    set({ zoom: clampedZoom })
  },

  zoomIn: () => {
    const { zoom } = get()
    // Increase by 25% each time
    get().setZoom(zoom * 1.25)
  },

  zoomOut: () => {
    const { zoom } = get()
    // Decrease by 25% each time
    get().setZoom(zoom / 1.25)
  },

  resetZoom: () => {
    set({ zoom: 1 })
  },

  setActivePanel: (panel) => {
    set({ activePanel: panel })
  },

  exportCanvas: () => {
    const { slides, currentSlideIndex } = get()
    
    const exportData: EditorExportData = {
      slides: JSON.parse(JSON.stringify(slides)), // Deep clone
      currentSlideIndex,
      version: '1.0.0',
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `canva-export-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },

  importCanvas: (data: EditorExportData) => {
    // Validate the imported data
    if (!data.slides || !Array.isArray(data.slides)) {
      throw new Error('Invalid import data: slides must be an array')
    }

    // Validate slides structure
    for (const slide of data.slides) {
      if (!slide.id || !Array.isArray(slide.elements)) {
        throw new Error('Invalid import data: each slide must have id and elements array')
      }
    }

    // Ensure at least one slide exists
    if (data.slides.length === 0) {
      throw new Error('Invalid import data: at least one slide is required')
    }

    // Validate currentSlideIndex
    const validIndex = Math.max(0, Math.min(data.currentSlideIndex || 0, data.slides.length - 1))

    // Reset state and load imported data
    set({
      slides: JSON.parse(JSON.stringify(data.slides)), // Deep clone
      currentSlideIndex: validIndex,
      selectedElementIds: [],
      history: [],
      historyIndex: -1,
      zoom: 1,
    })

    // Save initial snapshot after import
    get().saveSnapshot()
  },

  setCanvasRef: (canvas) => {
    set({ canvasRef: canvas })
  },

  exportCurrentSlideAsPDF: async () => {
    const { canvasRef, currentSlideIndex } = get()
    if (!canvasRef) {
      throw new Error('Canvas not available')
    }
    // Use existing canvas for current slide
    await exportAsPDF(canvasRef, `slide-${currentSlideIndex + 1}.pdf`)
  },

  exportAllSlidesAsPDF: async () => {
    const { slides } = get()

    if (slides.length === 0) {
      throw new Error('No slides to export')
    }

    // Render each slide to an image
    const slideImages: string[] = []
    for (const slide of slides) {
      const imageDataUrl = await renderSlideToImage(slide, 2)
      slideImages.push(imageDataUrl)
    }

    // Send to backend for PDF generation
    const result = await exportSlidesAsPDF({
      data: { slideImages, filename: 'presentation.pdf' },
    })

    // Download the file
    const link = document.createElement('a')
    link.href = result.dataUrl
    link.download = result.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },

  exportAllSlidesAsPPTX: async () => {
    const { slides } = get()

    if (slides.length === 0) {
      throw new Error('No slides to export')
    }

    // Send slide data to backend for PPTX generation with editable elements
    // The backend will create actual PowerPoint text boxes and shapes
    const result = await exportSlidesAsPPTX({
      data: { slides, filename: 'presentation.pptx' },
    })

    // Download the file
    const link = document.createElement('a')
    link.href = result.dataUrl
    link.download = result.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },
}))


