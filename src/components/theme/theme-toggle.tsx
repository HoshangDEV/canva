import { useTheme } from '@/components/theme/theme-provider'
import { type VariantProps } from 'class-variance-authority'
import { MoonIcon, SunIcon } from 'lucide-react'
import { Button, buttonVariants } from '../ui/button'

export function ThemeToggle({
  className,
  variant = 'outline',
  size = 'icon',
}: {
  className?: string
  variant?: VariantProps<typeof buttonVariants>['variant']
  size?: VariantProps<typeof buttonVariants>['size']
}) {
  const { theme, setTheme } = useTheme()

  function toggleTheme() {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={toggleTheme}
    >
      <SunIcon className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
