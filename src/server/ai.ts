import { createServerFn } from '@tanstack/react-start'
import { GoogleGenAI } from '@google/genai'
import { readFile } from 'fs/promises'
import { join } from 'path'
import type { Slide } from '@/types/editor'

interface GeneratePresentationInput {
  prompt: string
}

interface GeneratePresentationOutput {
  slides: Slide[]
}

async function getUnsplashImage(query: string): Promise<string> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    throw new Error('UNSPLASH_ACCESS_KEY is not set')
  }

  const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}`

  const response = await fetch(url, {
    headers: { Authorization: `Client-ID ${accessKey}` },
  })

  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.urls.regular
}

function replaceImagePlaceholders(slides: Slide[]): Promise<Slide[]> {
  const imagePlaceholderRegex = /\[IMAGE_([^\]]+)\]/g
  const imageCache = new Map<string, Promise<string>>()

  // Find all unique image queries
  const queries = new Set<string>()
  slides.forEach((slide) => {
    slide.elements.forEach((element) => {
      if (element.type === 'image' && element.imageUrl) {
        const matches = element.imageUrl.matchAll(imagePlaceholderRegex)
        for (const match of matches) {
          queries.add(match[1])
        }
      }
    })
  })

  // Fetch images for each unique query
  queries.forEach((query) => {
    if (!imageCache.has(query)) {
      imageCache.set(
        query,
        getUnsplashImage(query).catch((error) => {
          console.error(`Failed to fetch image for query "${query}":`, error)
          return '' // Return empty string on error
        })
      )
    }
  })

  // Replace placeholders in slides
  return Promise.all(
    slides.map(async (slide) => ({
      ...slide,
      elements: await Promise.all(
        slide.elements.map(async (element) => {
          if (element.type === 'image' && element.imageUrl) {
            let imageUrl = element.imageUrl
            const matches = Array.from(imageUrl.matchAll(imagePlaceholderRegex))

            for (const match of matches) {
              const query = match[1]
              const imageUrlPromise = imageCache.get(query)
              if (imageUrlPromise) {
                const actualUrl = await imageUrlPromise
                imageUrl = imageUrl.replace(match[0], actualUrl)
              }
            }

            return { ...element, imageUrl }
          }
          return element
        })
      ),
    }))
  )
}

export const generatePresentation = createServerFn({
  method: 'POST',
})
  .inputValidator((data: GeneratePresentationInput) => data)
  .handler(async ({ data }): Promise<GeneratePresentationOutput> => {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set')
    }

    // Load AI instructions from prompt file
    let promptInstructions = ''
    try {
      const promptPath = join(process.cwd(), 'src', 'prompts', 'generate-presentation.md')
      promptInstructions = await readFile(promptPath, 'utf-8')
    } catch (error) {
      console.error('Failed to read prompt file:', error)
      // Fallback to basic instructions
      promptInstructions = `You are an AI assistant that generates presentation slides in JSON format.
Each slide should have elements (text, shape, image).
Canvas size is 960x540 pixels (16:9 aspect ratio).
For images, use placeholders in format [IMAGE_query] (e.g., [IMAGE_mountains]).
Return only valid JSON with this structure:
{
  "slides": [
    {
      "id": "slide-1",
      "elements": [
        {
          "id": "element-1",
          "type": "text",
          "x": 100,
          "y": 100,
          "width": 200,
          "height": 50,
          "rotation": 0,
          "content": "Title",
          "fontSize": 32,
          "fontColor": "#000000",
          "textAlign": "center"
        }
      ]
    }
  ]
}`
    }

    // Initialize Gemini API
    const genAI = new GoogleGenAI({ apiKey })

    // Combine instructions with user prompt
    const fullPrompt = `${promptInstructions}\n\nUser request: ${data.prompt}\n\nGenerate the presentation JSON:`

    try {
      const result = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-preview-09-2025',
        contents: fullPrompt,
      })
      const text = result.text || ''

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = text.trim()
      if (jsonText.startsWith('```')) {
        const lines = jsonText.split('\n')
        const startIndex = lines.findIndex((line: string) => line.includes('{'))
        const endIndex = lines.findIndex((line: string, idx: number) => idx > startIndex && line.includes('}'))
        if (startIndex !== -1 && endIndex !== -1) {
          jsonText = lines.slice(startIndex, endIndex + 1).join('\n')
        } else {
          // Try to extract JSON between code blocks
          jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        }
      }

      const parsed = JSON.parse(jsonText)

      // Validate structure
      if (!parsed.slides || !Array.isArray(parsed.slides)) {
        throw new Error('Invalid response format: missing slides array')
      }

      // Replace image placeholders with Unsplash images
      const slidesWithImages = await replaceImagePlaceholders(parsed.slides)

      return { slides: slidesWithImages }
    } catch (error) {
      console.error('Failed to generate presentation:', error)
      throw new Error(`Failed to generate presentation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

