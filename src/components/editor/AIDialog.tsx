'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { isRTLText } from '@/lib/utils'
import { generatePresentation } from '@/server/ai'
import { useEditorStore } from '@/store/editor-store'
import { useTransition } from 'react'

const formSchema = z.object({
  prompt: z.string().min(1, {
    message: 'Prompt cannot be empty.',
  }),
})

interface AIDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AIDialog({
  open: controlledOpen,
  onOpenChange,
}: AIDialogProps) {
  const { setSlides } = useEditorStore()
  const [isPending, startTransition] = useTransition()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt:
        'write presentation about kurdistan with 1 slide and add a image from unsplash',
    },
    disabled: isPending,
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Handle form submission here
    startTransition(async () => {
      console.log(values)
      const response = await generatePresentation({
        data: { prompt: values.prompt },
      })

      const parsed = JSON.parse(response.presentation)
      setSlides(parsed.slides)
      onOpenChange?.(false)
      form.reset()
    })
  }

  return (
    <Dialog open={controlledOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>AI Prompt</DialogTitle>
          <DialogDescription>
            Enter your prompt to generate content.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your prompt here..."
                      className="min-h-[120px]"
                      {...field}
                      disabled={isPending}
                      style={{
                        direction: isRTLText(field.value) ? 'rtl' : 'ltr',
                        textAlign: isRTLText(field.value) ? 'right' : 'left',
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Generating...' : 'Submit'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
