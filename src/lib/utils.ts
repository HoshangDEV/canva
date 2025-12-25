import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
