# Recreate Presentation Editor Application with Fabric.js

Build a complete presentation editor application (similar to Canva/PowerPoint) using **Fabric.js** for canvas manipulation. This is a web-based slide presentation creator with AI-powered generation capabilities.

## Tech Stack Requirements

### Core Technologies
- **React 19** with **TypeScript**
- **Fabric.js** (v5 or v6) for canvas-based element manipulation
- **TanStack Router** for routing
- **TanStack Start** for full-stack React framework
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Shadcn UI** components for UI elements
- **Vite** as build tool

### Backend/API
- **Google Gemini API** (gemini-2.5-flash-preview-09-2025) for AI presentation generation
- **Unsplash API** for fetching images
- Server functions using `@tanstack/react-start` createServerFn

### Package Manager
- Use **Bun** as the package manager and runtime

---

## Application Overview

A multi-slide presentation editor where users can:
- Create/edit/delete slides
- Add text, shapes, and images to slides
- Manipulate elements (drag, resize, rotate) using **Fabric.js canvas**
- Use AI to generate complete presentations from prompts
- Edit element properties (colors, fonts, alignment, etc.)
- Support RTL (Right-to-Left) text for Arabic/Kurdish languages
- Undo/Redo functionality
- Zoom in/out on canvas
- Align elements to canvas
- Manage element z-order (bring forward, send backward, etc.)

### Canvas Specifications
- **Canvas size:** 1280px × 720px (16:9 aspect ratio)
- **Background:** White canvas with shadow
- **Container:** Gray background with padding
- **Zoom range:** 25% to 300%

---

## Data Structure

### State Management (Zustand Store)

```typescript
// Element types
export type ElementType = 'text' | 'shape' | 'image'

export type AlignmentType =
  | 'left'
  | 'center-h'
  | 'right'
  | 'top'
  | 'center-v'
  | 'bottom'

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
  textAlign?: 'left' | 'center' | 'right' | 'justify'
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

// Editor state
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
}
```

---

## Component Structure

### 1. Main Editor Component (`Editor.tsx`)
```
┌─────────────────────────────────────────────────────────┐
│                     Toolbar                             │
├────────┬──────────────────────────────┬─────────────────┤
│        │                              │                 │
│ Slide  │         Canvas               │   Properties    │
│ Panel  │    (Fabric.js Canvas)        │     Panel       │
│        │                              │                 │
│        │                              │                 │
└────────┴──────────────────────────────┴─────────────────┘
```

**Layout:**
- Full screen flexbox layout
- Toolbar at top (horizontal)
- Three-column layout below: SlidePanel | Canvas | PropertiesPanel

---

### 2. Toolbar Component

**Features:**
- Undo/Redo buttons (with keyboard shortcuts: Cmd+Z / Ctrl+Z, Cmd+Shift+Z / Ctrl+Y)
- AI Prompt button (opens dialog)
- Add Text button
- Add Shape button (creates blue rectangle)
- Add Image button (creates image placeholder)
- Zoom controls (Zoom In, Zoom Out, Reset, show percentage)

**Keyboard Shortcuts:**
- `Cmd+Z` / `Ctrl+Z` → Undo
- `Cmd+Shift+Z` / `Ctrl+Shift+Z` / `Ctrl+Y` → Redo
- `Cmd+Scroll` / `Ctrl+Scroll` → Zoom in/out

**Default Element Creation:**
- **Text:** `x: 100, y: 100, width: 200, height: 50, content: "New Text", fontSize: 24, fontColor: "#000000"`
- **Shape:** `x: 100, y: 100, width: 150, height: 150, color: "#3b82f6", borderRadius: 4`
- **Image:** `x: 100, y: 100, width: 200, height: 150, imageUrl: ""` (empty placeholder)

---

### 3. Canvas Component (Fabric.js Integration)

**Key Requirements:**

#### Canvas Setup
```typescript
import { fabric } from 'fabric'

// Create Fabric canvas
const canvas = new fabric.Canvas('canvas', {
  width: 1280,
  height: 720,
  backgroundColor: '#ffffff',
  selection: true, // Enable multi-selection
  preserveObjectStacking: true,
})
```

#### Element Rendering

**Text Elements:**
```typescript
const textElement = new fabric.IText(element.content || 'Text', {
  left: element.x,
  top: element.y,
  width: element.width,
  fontSize: element.fontSize || 16,
  fill: element.fontColor || '#000000',
  textAlign: element.textAlign || 'left',
  // For RTL support
  direction: isRTLText(element.content) ? 'rtl' : 'ltr',
})
```

**Shape Elements:**
```typescript
const shapeElement = new fabric.Rect({
  left: element.x,
  top: element.y,
  width: element.width,
  height: element.height,
  fill: element.color || '#3b82f6',
  rx: element.borderRadius || 4,
  ry: element.borderRadius || 4,
})
```

**Image Elements:**
```typescript
fabric.Image.fromURL(element.imageUrl || '', (img) => {
  img.set({
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
  })
  // Apply border radius using clipPath if needed
  canvas.add(img)
})
```

#### Element Manipulation

**Enable Fabric.js features:**
- **Drag:** Built-in with `selectable: true`
- **Resize:** Use object controls
- **Rotate:** Use rotation control
- **Multi-select:** Shift+Click or drag selection box
- **Snapping:** Implement using object:moving event with guidelines
- **Bounds:** Constrain movement within canvas using `object:moving` event

**Guidelines/Snapping:**
```typescript
// Implement snapping to canvas center and edges
canvas.on('object:moving', (e) => {
  const obj = e.target
  const snapThreshold = 5

  // Snap to canvas center (480, 270)
  // Snap to canvas edges (0, 1280, 0, 720)
  // Snap to other objects
})
```

**Sync State to Zustand:**
```typescript
// On object modification, update Zustand store
canvas.on('object:modified', (e) => {
  const fabricObject = e.target
  const elementId = fabricObject.get('elementId') // Custom property

  updateElement(elementId, {
    x: fabricObject.left,
    y: fabricObject.top,
    width: fabricObject.width * fabricObject.scaleX,
    height: fabricObject.height * fabricObject.scaleY,
    rotation: fabricObject.angle,
  })
})
```

#### Selection Management
```typescript
// Handle selection changes
canvas.on('selection:created', (e) => {
  const selected = e.selected.map(obj => obj.get('elementId'))
  selectElement(selected)
})

canvas.on('selection:cleared', () => {
  selectElement(null)
})
```

#### Text Editing
- **Double-click text** to enter edit mode (Fabric.js IText supports this)
- **Enter** to save, **Escape** to cancel
- Auto-resize text height based on content
- Support RTL text direction

#### Zoom Implementation
```typescript
// Zoom with Ctrl+Scroll
canvas.on('mouse:wheel', (opt) => {
  if (opt.e.ctrlKey || opt.e.metaKey) {
    opt.e.preventDefault()
    const delta = opt.e.deltaY
    let zoom = canvas.getZoom()
    zoom *= 0.999 ** delta

    if (zoom > 3) zoom = 3
    if (zoom < 0.25) zoom = 0.25

    canvas.setZoom(zoom)
    setZoom(zoom)
  }
})
```

#### Canvas Bounds
```typescript
// Prevent objects from moving outside canvas
canvas.on('object:moving', (e) => {
  const obj = e.target
  const bounds = {
    left: 0,
    top: 0,
    right: 1280,
    bottom: 720,
  }

  obj.setCoords()
  if (obj.getBoundingRect().left < bounds.left) {
    obj.set('left', bounds.left)
  }
  // Similar for right, top, bottom
})
```

---

### 4. Slide Panel Component

**Features:**
- Display slide thumbnails (vertical list)
- Show slide number
- Click to switch slides
- Add new slide button
- Delete slide button (only if more than 1 slide)
- Highlight current slide (blue border)

**Thumbnail Rendering:**
- Render mini preview of each slide (aspect ratio 16:9)
- Scale elements proportionally
- Use CSS transforms for positioning
- Show text content, shapes (with colors), and image placeholders

**Dimensions:**
- Panel width: 192px (w-48)
- Thumbnail: aspect-video (16:9)

---

### 5. Properties Panel Component

**Features:**
Display different properties based on selected element(s):

#### When No Selection
- Show: "Select an element to edit"

#### When Multi-Selection
- Show: "X Elements" (count)
- Show common controls: Alignment, Arrange, Delete

#### When Single Selection

**Common Properties (All Types):**
- Position: X, Y (number inputs)
- Size: Width, Height (number inputs)
- Rotation: Slider (-180 to 180) + number input
- Alignment buttons (6 buttons): Left, Center-H, Right, Top, Center-V, Bottom
- Arrange buttons (4 buttons): Bring to Front, Bring Forward, Send Backward, Send to Back
- Delete button

**Text-Specific:**
- Content: Textarea (with RTL support)
- Text Align: 4 buttons (Left, Center, Right, Justify)
- Font Size: Number input (8-200)
- Font Color: Color picker + hex input

**Shape-Specific:**
- Fill Color: Color picker + hex input
- Border Radius: Slider (0-100) + number input

**Image-Specific:**
- Image URL: Text input
- Border Radius: Slider (0-100) + number input

**UI:**
- Width: 256px (w-64)
- Icons from `lucide-react`
- Scrollable overflow

---

### 6. AI Dialog Component

**Purpose:** Generate complete presentations using AI

**Form Fields:**
- Prompt textarea (default: "write presentation about kurdistan with 1 slide and add a image from unsplash")
- Submit button
- Cancel button

**Behavior:**
1. User enters prompt
2. On submit, call server function `generatePresentation({ data: { prompt } })`
3. Server calls Google Gemini API with instructions from `src/prompts/generate-presentation.md`
4. AI returns JSON with slides array
5. Parse JSON and replace image placeholders `[IMAGE_query]` with Unsplash images
6. Set slides in Zustand store
7. Close dialog and show generated presentation

**Server Function:**
```typescript
// src/server/ai.ts
export const generatePresentation = createServerFn({ method: 'POST' })
  .inputValidator((data: { prompt: string }) => data)
  .handler(async ({ data }) => {
    // 1. Load AI instructions from src/prompts/generate-presentation.md
    // 2. Call Google Gemini API
    // 3. Parse response JSON
    // 4. Replace [IMAGE_query] placeholders with Unsplash images
    // 5. Return processed presentation JSON
  })
```

---

## AI Presentation Generation

### Prompt Instructions (`src/prompts/generate-presentation.md`)

See the detailed prompt file content that instructs the AI how to generate presentations.

**Key Points:**
- Canvas: 1280×720px (16:9)
- Output JSON structure with slides array
- Element types: text, shape, image
- Design guidelines (typography, spacing, colors)
- Image placeholders: `[IMAGE_query]` format
- Layout patterns: title slide, content slide, two-column

### Image Placeholder Replacement

**Process:**
1. AI returns JSON with image URLs as placeholders: `[IMAGE_coffee]`, `[IMAGE_mountains]`, etc.
2. Server function parses JSON and finds all `[IMAGE_query]` patterns
3. For each unique query, fetch random image from Unsplash API
4. Replace placeholders with actual Unsplash image URLs
5. Return final JSON to client

**Unsplash API:**
```typescript
async function getUnsplashImage(query: string): Promise<string> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}`

  const response = await fetch(url, {
    headers: { 'Authorization': `Client-ID ${accessKey}` },
  })

  const data = await response.json()
  return data.urls.regular
}
```

---

## RTL (Right-to-Left) Text Support

### Detection Function
```typescript
// src/lib/utils.ts
export function isRTLText(text: string | undefined | null): boolean {
  if (!text || text.trim().length === 0) return false

  const trimmed = text.trim()

  // Find first meaningful character (skip symbols, punctuation, digits)
  for (let i = 0; i < trimmed.length; i++) {
    const codePoint = trimmed.codePointAt(i)
    if (!codePoint) continue

    // Check if Arabic/Kurdish character
    if (
      (codePoint >= 0x0600 && codePoint <= 0x06FF) || // Arabic
      (codePoint >= 0x0750 && codePoint <= 0x077F) || // Arabic Supplement
      (codePoint >= 0x08A0 && codePoint <= 0x08FF) || // Arabic Extended-A
      (codePoint >= 0xFB50 && codePoint <= 0xFDFF) || // Arabic Presentation Forms-A
      (codePoint >= 0xFE70 && codePoint <= 0xFEFF)    // Arabic Presentation Forms-B
    ) {
      return true
    }

    // If Latin letter found first, it's LTR
    if ((codePoint >= 0x0041 && codePoint <= 0x005A) ||
        (codePoint >= 0x0061 && codePoint <= 0x007A)) {
      return false
    }
  }

  return false
}
```

### Application
- Use for text elements: set `direction: rtl` and `textAlign: right` for RTL text
- Use in textarea inputs for content editing
- Apply in slide thumbnails

---

## Undo/Redo System

### Implementation
- Store history snapshots in Zustand store
- Each snapshot contains: `{ slides, currentSlideIndex, selectedElementIds }`
- Max history size: 50 snapshots
- Push snapshot on every modification (add/update/delete/reorder elements, add/delete slides)

**Functions:**
```typescript
undo: () => {
  if (historyIndex > 0) {
    // Restore snapshot at historyIndex - 1
    // Update historyIndex
  }
}

redo: () => {
  if (historyIndex < history.length - 1) {
    // Restore snapshot at historyIndex + 1
    // Update historyIndex
  }
}

canUndo: () => historyIndex > 0
canRedo: () => historyIndex < history.length - 1
```

---

## Alignment & Arrange Features

### Alignment (Align to Canvas)
```typescript
alignElements: (alignment: AlignmentType) => {
  switch (alignment) {
    case 'left': x = 0; break
    case 'center-h': x = (1280 - width) / 2; break
    case 'right': x = 1280 - width; break
    case 'top': y = 0; break
    case 'center-v': y = (720 - height) / 2; break
    case 'bottom': y = 720 - height; break
  }
}
```

### Z-Order (Arrange)
Elements are rendered in array order (first = back, last = front).

**Operations:**
- **Bring to Front:** Move selected elements to end of array
- **Send to Back:** Move selected elements to start of array
- **Bring Forward:** Swap with next element (if not already selected)
- **Send Backward:** Swap with previous element (if not already selected)

In Fabric.js:
```typescript
canvas.bringToFront(fabricObject)
canvas.sendToBack(fabricObject)
canvas.bringForward(fabricObject)
canvas.sendBackwards(fabricObject)
```

Sync these operations back to Zustand store to maintain state consistency.

---

## Styling & UI

### Tailwind CSS
Use Tailwind v4 with the following color scheme:

**Colors:**
- Background: `bg-gray-100`
- Canvas: `bg-white`
- Selected outline: `outline-blue-500` (2px)
- Text colors: `text-gray-600`, `text-gray-800`
- Buttons: `bg-gray-100 hover:bg-gray-200`

### Shadcn UI Components
Install and use:
- `Button`
- `Dialog` (for AI prompt)
- `Textarea`
- `Label`
- `Input`

**Installation:**
```bash
bun dlx shadcn@latest add button dialog textarea label input form
```

---

## Environment Variables

Create `.env.local`:
```env
GEMINI_API_KEY=your_google_gemini_api_key
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

---

## File Structure

```
src/
├── components/
│   ├── editor/
│   │   ├── Editor.tsx         # Main layout component
│   │   ├── Canvas.tsx         # Fabric.js canvas component
│   │   ├── Toolbar.tsx        # Top toolbar
│   │   ├── SlidePanel.tsx     # Left slide list
│   │   ├── PropertiesPanel.tsx # Right properties
│   │   └── ElementRenderer.tsx # (Optional: helper for rendering)
│   ├── ai-dialog.tsx          # AI prompt dialog
│   └── ui/                    # Shadcn UI components
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── textarea.tsx
│       ├── label.tsx
│       ├── input.tsx
│       └── form.tsx
├── store/
│   └── editor-store.ts        # Zustand store
├── server/
│   └── ai.ts                  # Server functions for AI
├── prompts/
│   └── generate-presentation.md # AI instructions
├── lib/
│   └── utils.ts               # Utility functions (isRTLText, cn)
├── types/
│   └── unsplash.ts            # Unsplash API types
├── routes/
│   ├── __root.tsx
│   └── index.tsx              # Main editor route
└── router.tsx                 # TanStack router setup
```

---

## Key Implementation Details

### 1. Syncing Fabric.js with Zustand Store

**Two-way sync is critical:**

**Store → Canvas (Rendering):**
When Zustand state changes (e.g., switching slides, adding elements), update Fabric canvas:
```typescript
useEffect(() => {
  // Clear canvas
  canvas.clear()

  // Render current slide elements
  currentSlide.elements.forEach(element => {
    const fabricObject = createFabricObject(element)
    fabricObject.set('elementId', element.id) // Store ID for reverse lookup
    canvas.add(fabricObject)
  })

  canvas.renderAll()
}, [currentSlide, slides])
```

**Canvas → Store (Modifications):**
When user modifies objects in Fabric, update Zustand:
```typescript
canvas.on('object:modified', (e) => {
  const obj = e.target
  const elementId = obj.get('elementId')

  updateElement(elementId, {
    x: obj.left,
    y: obj.top,
    width: obj.width * obj.scaleX,
    height: obj.height * obj.scaleY,
    rotation: obj.angle,
  })

  // Reset scale to 1 after applying to width/height
  obj.set({ scaleX: 1, scaleY: 1 })
  canvas.renderAll()
})
```

### 2. Text Editing with Auto-Resize

Use `fabric.IText` for editable text.

**Auto-resize height based on content:**
```typescript
textElement.on('editing:exited', () => {
  // Measure text height
  const height = textElement.height

  updateElement(textElement.get('elementId'), {
    content: textElement.text,
    height: height,
  })
})
```

### 3. Multi-Selection Handling

Fabric.js supports multi-selection out of the box:
```typescript
// Enable multi-selection
canvas.selection = true

// Selection events
canvas.on('selection:created', handleSelectionChange)
canvas.on('selection:updated', handleSelectionChange)
canvas.on('selection:cleared', () => selectElement(null))

function handleSelectionChange(e) {
  const selectedIds = e.selected.map(obj => obj.get('elementId'))
  // Update Zustand store with selected IDs
  // Don't replace the store's selectElement - just sync
}
```

### 4. Keyboard Shortcuts

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Undo: Cmd+Z / Ctrl+Z
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      undo()
    }

    // Redo: Cmd+Shift+Z / Ctrl+Shift+Z / Ctrl+Y
    if (
      ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') ||
      ((e.ctrlKey && !e.metaKey) && e.key === 'y')
    ) {
      e.preventDefault()
      redo()
    }

    // Delete: Backspace / Delete
    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (canvas.getActiveObject()) {
        e.preventDefault()
        deleteSelectedElements()
      }
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [undo, redo, deleteSelectedElements])
```

### 5. Image Border Radius in Fabric.js

Fabric.js doesn't natively support border radius on images. Use a clipPath:

```typescript
fabric.Image.fromURL(imageUrl, (img) => {
  if (borderRadius > 0) {
    const clipPath = new fabric.Rect({
      width: width,
      height: height,
      rx: borderRadius,
      ry: borderRadius,
      left: -width / 2,
      top: -height / 2,
    })
    img.set({ clipPath })
  }

  img.set({
    left: x,
    top: y,
    width: width,
    height: height,
  })

  canvas.add(img)
})
```

---

## Testing & Development

### Scripts
```json
{
  "scripts": {
    "dev": "vite dev --port 3000",
    "build": "vite build",
    "start": "node .output/server/index.mjs",
    "preview": "vite preview"
  }
}
```

### Run Development Server
```bash
bun install
bun --bun run dev
```

---

## Important Notes

1. **Don't use React Moveable** - Replace with Fabric.js for all canvas interactions
2. **Fabric.js Version** - Use latest stable (v5 or v6)
3. **Performance** - Fabric.js handles rendering efficiently, but avoid unnecessary re-renders
4. **State Consistency** - Always keep Zustand store and Fabric canvas in sync
5. **RTL Support** - Essential for Kurdish/Arabic text
6. **Responsive Design** - Canvas size is fixed (1280×720), but container should adapt
7. **Error Handling** - Handle API failures gracefully (Gemini, Unsplash)
8. **Type Safety** - Use TypeScript strictly for all components

---

## Additional Features to Consider

1. **Export Presentation** - Export slides as PDF or images
2. **Templates** - Predefined slide templates
3. **Animations** - Add slide transitions
4. **Collaboration** - Real-time editing (future)
5. **Themes** - Preset color schemes
6. **Keyboard Navigation** - Arrow keys to move elements
7. **Copy/Paste** - Duplicate elements
8. **Grid/Ruler** - Visual alignment aids

---

## Success Criteria

The recreated application should:
✅ Use Fabric.js for all canvas manipulation (no React Moveable)
✅ Support all element types (text, shape, image)
✅ Support multi-slide presentations
✅ Allow drag, resize, rotate operations
✅ Support multi-selection
✅ Have working undo/redo
✅ Support zoom in/out
✅ Support RTL text (Arabic/Kurdish)
✅ Generate presentations via AI (Google Gemini)
✅ Fetch images from Unsplash
✅ Have complete properties panel
✅ Support element alignment and z-order
✅ Be fully typed with TypeScript
✅ Use TanStack Router & Start
✅ Use Zustand for state management
✅ Use Tailwind CSS & Shadcn UI

---

## Final Notes

This prompt provides a complete specification for recreating the presentation editor using Fabric.js. The key difference from the original is replacing React Moveable with Fabric.js canvas, which provides more powerful canvas manipulation capabilities and better performance for complex graphics operations.

Start by setting up the basic layout (Editor, Toolbar, Canvas, SlidePanel, PropertiesPanel), then implement Fabric.js canvas integration, followed by state management, and finally the AI generation feature.

Good luck! 🚀