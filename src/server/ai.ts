import { createServerFn } from '@tanstack/react-start'
import { GoogleGenAI } from '@google/genai'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { UnsplashPhoto } from '@/types/unsplash'

/**
 * Fetches a random image from Unsplash based on a search query
 */
async function getUnsplashImage(query: string): Promise<string> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    throw new Error('UNSPLASH_ACCESS_KEY environment variable is not set')
  }

  const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
    },
  })

  if (!response.ok) {
    throw new Error(
      `Unsplash API error: ${response.status} ${response.statusText}`,
    )
  }

  const data = (await response.json()) as UnsplashPhoto
  // Return the regular size URL (good balance of quality and size)
  return data.urls.regular
}

/**
 * Recursively replaces image placeholders in an object with actual Unsplash URLs
 */
async function replaceImagePlaceholders(obj: any): Promise<any> {
  if (typeof obj === 'string') {
    // Check if string matches [IMAGE_QUERY] pattern
    const imagePlaceholderRegex = /\[IMAGE_([^\]]+)\]/g
    const matches = Array.from(obj.matchAll(imagePlaceholderRegex))

    if (matches.length > 0) {
      // Get unique queries (to avoid fetching the same image multiple times)
      const uniqueQueries = new Set(matches.map((m) => m[1]))

      // Fetch all unique images
      const imageMap = new Map<string, string>()
      for (const query of uniqueQueries) {
        try {
          const imageUrl = await getUnsplashImage(query)
          imageMap.set(query, imageUrl)
        } catch (error) {
          console.error(`Failed to fetch image for query "${query}":`, error)
          // Keep the placeholder if fetch fails
        }
      }

      // Replace all placeholders with actual image URLs
      let result = obj
      for (const [query, imageUrl] of imageMap.entries()) {
        // Replace all occurrences of this placeholder
        result = result.replaceAll(`[IMAGE_${query}]`, imageUrl)
      }
      return result
    }
    return obj
  } else if (Array.isArray(obj)) {
    return Promise.all(obj.map((item) => replaceImagePlaceholders(item)))
  } else if (obj !== null && typeof obj === 'object') {
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = await replaceImagePlaceholders(value)
    }
    return result
  }
  return obj
}

export const generatePresentation = createServerFn({ method: 'POST' })
  .inputValidator((data: { prompt: string }) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set')
    }

    const ai = new GoogleGenAI({ apiKey })
    const instructions = await readFile(
      join(process.cwd(), 'src', 'prompts', 'generate-presentation.md'),
      'utf-8',
    )

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-09-2025',
      contents: `${instructions}\n\n---\n\nUser Request: ${data.prompt}\n\nCRITICAL INSTRUCTIONS:\n- Your response must start with { and end with }\n- Return ONLY the raw JSON object\n- DO NOT use markdown formatting\n- DO NOT use code blocks (no \`\`\`json or \`\`\`)\n- DO NOT include any markdown syntax (no backticks, no markdown code blocks)\n- DO NOT add explanations, comments, or any text before or after the JSON\n- Return pure, unformatted JSON only\n- The response must be parseable JSON.parse() directly without any preprocessing`,
    })

    let presentation = response.text || ''

    // Parse the JSON to replace image placeholders
    try {
      const parsed = JSON.parse(presentation)
      const presentationWithImages = await replaceImagePlaceholders(parsed)
      presentation = JSON.stringify(presentationWithImages)
    } catch (error) {
      console.error('Failed to parse or replace image placeholders:', error)
      // Return original presentation if parsing fails
    }

    return { presentation }
  })
