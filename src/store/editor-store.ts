import { create } from 'zustand'
import type {
  Slide,
  SlideElement,
  AlignmentType,
  EditorStateSnapshot,
} from '@/types/editor'
import { CANVAS_CONFIG } from '@/constants'

interface EditorState {
  slides: Slide[]
  currentSlideIndex: number
  selectedElementIds: string[]
  history: EditorStateSnapshot[]
  historyIndex: number
  maxHistorySize: number
  zoom: number

  // Actions
  setSlides: (slides: Slide[]) => void
  setCurrentSlide: (index: number) => void
  selectElement: (id: string | null, addToSelection?: boolean) => void
  addElement: (element: Omit<SlideElement, 'id'>) => void
  updateElement: (id: string, updates: Partial<SlideElement>) => void
  updateElements: (updates: { id: string; changes: Partial<SlideElement> }[]) => void
  deleteElement: (id: string) => void
  deleteSelectedElements: () => void
  addSlide: () => void
  deleteSlide: (index: number) => void
  alignElements: (alignment: AlignmentType) => void
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
}))


