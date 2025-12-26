# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**bzan-canva** is a full-stack Canva-like presentation editor built with React and TypeScript. It allows users to create professional presentations with AI-powered generation capabilities using Google Gemini.

**Tech Stack:** React 19, TanStack ecosystem (Router, Start), Zustand, Fabric.js, Tailwind CSS, Shadcn/ui

## Development Commands

```bash
# Development
bun install                 # Install dependencies
bun --bun run start         # Start dev server on port 3000 (alternative)
npm run dev                 # Start dev server on port 3000 (Vite)

# Build & Production
npm run build              # Build for production (outputs to .output/)
npm start                  # Run production server (Nitro)

# Code Quality
npm run check              # Format with Prettier + lint with ESLint (auto-fix)
npm run lint               # Run ESLint
npm run format             # Run Prettier
npm run check-types        # TypeScript type checking

# Testing
npm run test               # Run Vitest

# Database (Prisma)
npm run db:generate        # Generate Prisma client
npm run db:push            # Push schema to database
npm run db:migrate         # Run migrations
npm run db:studio          # Open Prisma Studio
npm run db:seed            # Seed database

# UI Components
pnpm dlx shadcn@latest add [component-name]  # Add new Shadcn component
```

## Architecture Overview

### Full-Stack React Application

```
UI Layer (React Components)
  ↓
State Management (Zustand Store)
  ↓
Canvas Rendering (Fabric.js)
  ↓
Server Functions (TanStack React Start)
  ↓
External APIs (Google Gemini, Unsplash)
```

### Key Architectural Patterns

1. **File-Based Routing:** Routes are defined in `src/routes/`. TanStack Router auto-generates the route tree.

2. **State Management:** Centralized Zustand store (`src/store/editor-store.ts`) manages all editor state with 40+ actions.

3. **Server Functions:** Backend logic lives in `src/server/` and uses TanStack React Start's `createServerFn`.

4. **Canvas Rendering:** Fabric.js handles all canvas operations (selection, dragging, resizing, rotation).

5. **AI Generation:** Google Gemini generates presentation JSON based on detailed prompts in `src/prompts/`.

### Core Data Structures

**Canvas Dimensions:** 1280x720 pixels (16:9 aspect ratio)

**Element Types:**
- `text` - Text elements with font properties (content, fontSize, fontColor, fontFamily, textAlign)
- `shape` - Rectangle elements with color and borderRadius
- `image` - Image elements with imageUrl and borderRadius

**Slide Structure:**
```typescript
Slide {
  id: string
  elements: SlideElement[]
}
```

**Element Structure:**
```typescript
SlideElement {
  id: string
  type: 'text' | 'shape' | 'image'
  x: number                    // Position (top-left corner)
  y: number
  width: number               // Dimensions
  height: number
  rotation: number            // Degrees (0-360)

  // Type-specific properties (optional)
  content?: string           // Text content
  fontSize?: number          // Text size in pixels
  fontColor?: string         // Hex color
  fontFamily?: string
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  color?: string             // Shape fill color
  borderRadius?: number      // Corner radius (0-100)
  imageUrl?: string          // Image URL
}
```

## Critical Implementation Details

### Zustand Store (`src/store/editor-store.ts`)

The editor store is the single source of truth for all editor state. Key concepts:

**History System:**
- Max 50 snapshots (configurable via `maxHistorySize`)
- Snapshots are deep clones of `{ slides, currentSlideIndex, selectedElementIds }`
- Call `saveSnapshot()` after operations that modify slide state
- Undo/redo managed via `historyIndex`

**Key Actions:**
- `setSlides(slides)` - Replace all slides (saves snapshot)
- `addElement(element)` - Add element to current slide (auto-generates ID)
- `updateElement(id, updates)` - Update single element
- `updateElements(updates)` - Batch update multiple elements
- `deleteSelectedElements()` - Delete all selected elements
- `alignElements(alignment)` - Align selected elements (left, center-h, right, top, center-v, bottom)
- `bringToFront/sendToBack/bringForward/sendBackward` - Z-index manipulation
- `undo()/redo()` - History navigation
- `setZoom/zoomIn/zoomOut/resetZoom` - Zoom controls (0.25x - 3x range)

### Canvas Component (`src/components/editor/Canvas.tsx`)

**Fabric.js Integration:**
- Initializes Fabric canvas on mount
- Syncs Zustand store state → Fabric objects on every render
- Handles object selection, movement, resizing, rotation
- Converts Fabric scale transforms to width/height updates
- Enforces canvas boundaries (elements can't move outside 1280x720)

**Event Handlers:**
- `object:modified` - Updates store when element is modified
- `selection:created/updated/cleared` - Syncs selection state
- `mouse:wheel` - Zoom with Ctrl/Cmd + scroll
- Keyboard: Delete/Backspace to delete selected elements

**RTL Text Support:**
- Uses `isRTLText()` utility to detect Arabic/Kurdish text
- Applies correct text direction to Fabric text objects

### AI Presentation Generation (`src/server/ai.ts`)

**Workflow:**
1. Loads detailed instructions from `src/prompts/generate-presentation.md`
2. Combines instructions + user prompt
3. Calls Google Gemini API (`gemini-2.5-flash-preview-09-2025` model)
4. Parses JSON response (handles markdown code blocks)
5. Replaces `[IMAGE_query]` placeholders with Unsplash images
6. Returns structured slides

**Image Handling:**
- AI generates placeholder format: `[IMAGE_mountains]`, `[IMAGE_business_meeting]`
- `replaceImagePlaceholders()` extracts unique queries
- Fetches images from Unsplash API in parallel
- Caches results per query to avoid duplicates

**Environment Variables Required:**
- `GEMINI_API_KEY` - Google Gemini API key
- `UNSPLASH_ACCESS_KEY` - Unsplash API access key

### Component Structure

```
src/components/
├── ui/                      # Shadcn components (don't modify directly)
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── select.tsx
│   ├── slider.tsx
│   └── textarea.tsx
│
└── editor/                  # Editor-specific components
    ├── Editor.tsx           # Main container (layout)
    ├── Canvas.tsx           # Fabric.js canvas + event handling
    ├── Toolbar.tsx          # Top toolbar (add elements, undo/redo, zoom)
    ├── SlidePanel.tsx       # Left sidebar (slide thumbnails + add slide)
    ├── PropertiesPanel.tsx  # Right sidebar (element properties)
    └── AIDialog.tsx         # AI prompt dialog
```

**Editor Layout:**
- Toolbar at top
- SlidePanel on left (fixed width)
- Canvas in center (responsive with zoom)
- PropertiesPanel on right (fixed width)

## Routing & Entry Points

**Root Layout:** `src/routes/__root.tsx` - Renders HTML shell, meta tags, devtools

**Home Route:** `src/routes/index.tsx` - Renders `<Editor />` component

**Router Config:** `src/router.tsx` - TanStack Router with scroll restoration

**Note:** Route tree is auto-generated at `src/routeTree.gen.ts` - never edit manually.

## Keyboard Shortcuts

```
Cmd+Z / Ctrl+Z               - Undo
Cmd+Shift+Z / Ctrl+Shift+Z   - Redo
Ctrl+Y                       - Redo (alternative)
Delete / Backspace           - Delete selected element(s)
Ctrl+Scroll / Cmd+Scroll     - Zoom in/out
```

## Styling System

**Tailwind CSS 4.0** with Shadcn/ui (Radix Nova style, Neutral base color)

**Theme Configuration:**
- Config: `components.json`
- Style: `radix-nova`
- Base color: `neutral`
- CSS variables defined in `src/styles.css`

**Path Alias:** `@/*` → `./src/*`

## Common Development Patterns

### Adding a New Element Type

1. Update type definitions in `src/types/editor.ts`
2. Extend element rendering logic in `src/components/editor/Canvas.tsx`
3. Add property controls in `src/components/editor/PropertiesPanel.tsx`
4. Update AI prompt in `src/prompts/generate-presentation.md`

### Adding a New Toolbar Action

1. Add button/control in `src/components/editor/Toolbar.tsx`
2. Add corresponding action to Zustand store in `src/store/editor-store.ts`
3. Call action from button onClick handler
4. Ensure `saveSnapshot()` is called if action modifies state

### Modifying AI Generation

1. Edit instructions in `src/prompts/generate-presentation.md`
2. Test by calling `generatePresentation` server function
3. Update type definitions if output structure changes

## Testing

**Framework:** Vitest 3.0.5

**Libraries:** @testing-library/react, jsdom

**Note:** No application tests currently exist. Infrastructure is in place for future testing.

## Database (Prisma)

**Provider:** PostgreSQL
**ORM:** Prisma
**Adapter:** `@prisma/adapter-pg`

Database scripts use `.env.local` for environment variables (via `dotenv -e .env.local`).

## Important Notes

### Shadcn Component Installation

Always use the latest version:
```bash
pnpm dlx shadcn@latest add [component-name]
```

### Git Branch Strategy

- **Main branch:** `main`
- **Current working branch:** `fabric` (Fabric.js integration work)

### Package Manager

Uses **Bun** (`bun.lock` present), but npm scripts work for most commands.

### Vite Configuration

**Plugins (in order):**
1. TanStack Devtools
2. Nitro (server runtime)
3. vite-tsconfig-paths (path aliases)
4. Tailwind CSS
5. TanStack Start (full-stack framework)
6. Vite React

### TypeScript Settings

- Strict mode enabled
- No unused parameters/locals enforced
- Target: ES2022
- Module: ESNext
- JSX: react-jsx
