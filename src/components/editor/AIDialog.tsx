import { useState } from 'react'
import { useEditorStore } from '@/store/editor-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { generatePresentation } from '@/server/ai'

interface AIDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AIDialog({ open: controlledOpen, onOpenChange }: AIDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [prompt, setPrompt] = useState(
    'write presentation about kurdistan with 1 slide and add a image from unsplash'
  )
  const [loading, setLoading] = useState(false)

  const { setSlides } = useEditorStore()

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const handleSubmit = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    try {
      const result = await generatePresentation({ data: { prompt } })
      if (result.slides && Array.isArray(result.slides)) {
        setSlides(result.slides)
        setOpen(false)
      }
    } catch (error) {
      console.error('Failed to generate presentation:', error)
      alert('Failed to generate presentation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Presentation with AI</DialogTitle>
          <DialogDescription>
            Enter a prompt to generate a complete presentation. The AI will create
            slides with text, shapes, and images.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="write presentation about kurdistan with 1 slide and add a image from unsplash"
              className="mt-1 min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !prompt.trim()}>
            {loading ? 'Generating...' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

