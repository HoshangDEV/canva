// Element types
export type ElementType = 'text' | 'shape' | 'image'

export type AlignmentType =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'mid-left'
  | 'mid-center'
  | 'mid-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

// Slide element interface
export interface SlideElement {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  // Text-specific properties
  content?: string
  fontSize?: number
  fontColor?: string
  fontFamily?: string
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  textDirection?: 'rtl' | 'ltr'
  // Shape/Image properties
  color?: string
  borderRadius?: number
  // Image-specific
  imageUrl?: string
}

// Slide interface
export interface Slide {
  id: string
  elements: SlideElement[]
}

// Editor state snapshot for undo/redo
export interface EditorStateSnapshot {
  slides: Slide[]
  currentSlideIndex: number
  selectedElementIds: string[]
}

