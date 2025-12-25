import { create } from 'zustand'
import type {
  Slide,
  SlideElement,
  AlignmentType,
  EditorStateSnapshot,
} from '@/types/editor'

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
  setZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  saveSnapshot: () => void
}

const CANVAS_WIDTH = 960
const CANVAS_HEIGHT = 540

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
      // Calculate the center point of the element
      const centerX = element.x + element.width / 2
      const centerY = element.y + element.height / 2
      
      let newCenterX = centerX
      let newCenterY = centerY

      switch (alignment) {
        case 'left':
          // Align left edge: center should be at width/2 from left edge
          newCenterX = element.width / 2
          break
        case 'center-h':
          // Center horizontally
          newCenterX = CANVAS_WIDTH / 2
          break
        case 'right':
          // Align right edge: center should be at CANVAS_WIDTH - width/2
          newCenterX = CANVAS_WIDTH - element.width / 2
          break
        case 'top':
          // Align top edge: center should be at height/2 from top
          newCenterY = element.height / 2
          break
        case 'center-v':
          // Center vertically
          newCenterY = CANVAS_HEIGHT / 2
          break
        case 'bottom':
          // Align bottom edge: center should be at CANVAS_HEIGHT - height/2
          newCenterY = CANVAS_HEIGHT - element.height / 2
          break
      }

      // Convert center coordinates back to top-left coordinates
      const newX = newCenterX - element.width / 2
      const newY = newCenterY - element.height / 2

      updates.push({ id: element.id, changes: { x: newX, y: newY } })
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

  setZoom: (zoom) => {
    set({ zoom: Math.max(0.25, Math.min(3, zoom)) })
  },

  zoomIn: () => {
    const { zoom } = get()
    get().setZoom(zoom * 1.2)
  },

  zoomOut: () => {
    const { zoom } = get()
    get().setZoom(zoom / 1.2)
  },

  resetZoom: () => {
    set({ zoom: 1 })
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
}))

