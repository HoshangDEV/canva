import type { SlideElement } from '@/types/editor'

export interface DiffResult {
  added: SlideElement[]
  removed: string[]
  updated: SlideElement[]
  unchanged: string[]
}

/**
 * Compare two arrays of SlideElements and determine what changed
 */
export function diffElements(
  prevElements: SlideElement[],
  nextElements: SlideElement[]
): DiffResult {
  const prevMap = new Map(prevElements.map((el) => [el.id, el]))
  const nextMap = new Map(nextElements.map((el) => [el.id, el]))

  const added: SlideElement[] = []
  const removed: string[] = []
  const updated: SlideElement[] = []
  const unchanged: string[] = []

  // Find added and updated elements
  for (const nextEl of nextElements) {
    const prevEl = prevMap.get(nextEl.id)
    if (!prevEl) {
      added.push(nextEl)
    } else if (!isElementEqual(prevEl, nextEl)) {
      updated.push(nextEl)
    } else {
      unchanged.push(nextEl.id)
    }
  }

  // Find removed elements
  for (const prevEl of prevElements) {
    if (!nextMap.has(prevEl.id)) {
      removed.push(prevEl.id)
    }
  }

  return { added, removed, updated, unchanged }
}

/**
 * Deep equality check for SlideElement
 */
function isElementEqual(a: SlideElement, b: SlideElement): boolean {
  // Quick reference check
  if (a === b) return true

  // Compare all properties
  return (
    a.id === b.id &&
    a.type === b.type &&
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height &&
    a.rotation === b.rotation &&
    // Text properties
    a.content === b.content &&
    a.fontSize === b.fontSize &&
    a.fontColor === b.fontColor &&
    a.fontFamily === b.fontFamily &&
    a.fontWeight === b.fontWeight &&
    a.fontStyle === b.fontStyle &&
    a.textAlign === b.textAlign &&
    a.textDirection === b.textDirection &&
    // Shape/image properties
    a.color === b.color &&
    a.borderRadius === b.borderRadius &&
    a.imageUrl === b.imageUrl
  )
}

/**
 * Check if only position/rotation changed (for optimization)
 */
export function isOnlyTransformChange(prev: SlideElement, next: SlideElement): boolean {
  // All properties except position and rotation must be the same
  return (
    prev.id === next.id &&
    prev.type === next.type &&
    prev.width === next.width &&
    prev.height === next.height &&
    prev.content === next.content &&
    prev.fontSize === next.fontSize &&
    prev.fontColor === next.fontColor &&
    prev.fontFamily === next.fontFamily &&
    prev.fontWeight === next.fontWeight &&
    prev.fontStyle === next.fontStyle &&
    prev.textAlign === next.textAlign &&
    prev.textDirection === next.textDirection &&
    prev.color === next.color &&
    prev.borderRadius === next.borderRadius &&
    prev.imageUrl === next.imageUrl
  )
}

/**
 * Check if image URL changed (requires full recreation)
 */
export function isImageUrlChanged(prev: SlideElement, next: SlideElement): boolean {
  return prev.type === 'image' && next.type === 'image' && prev.imageUrl !== next.imageUrl
}
