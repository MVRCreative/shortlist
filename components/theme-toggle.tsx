'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative"
    >
      <Sun className="size-4 scale-100 opacity-100 transition-[opacity,transform] duration-200 ease-out dark:scale-95 dark:opacity-0" />
      <Moon className="absolute size-4 scale-95 opacity-0 transition-[opacity,transform] duration-200 ease-out dark:scale-100 dark:opacity-100" />
    </Button>
  )
}
