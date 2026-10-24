import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ChoiceChip({
  selected,
  onToggle,
  selectedClassName = 'border-foreground/20 bg-accent text-foreground',
  disabled,
  children,
}: {
  selected: boolean
  onToggle: () => void
  selectedClassName?: string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium',
        'transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.97]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        selected
          ? selectedClassName
          : 'border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground',
      )}
    >
      {selected ? <Check className="-ml-0.5 size-3.5" aria-hidden="true" /> : null}
      {children}
    </button>
  )
}
