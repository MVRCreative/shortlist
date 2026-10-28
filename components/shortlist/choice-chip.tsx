import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const chipClass =
  'press inline-flex h-8 items-center gap-1.5 rounded-full border text-sm font-normal transition-[background-color,border-color,color,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base disabled:pointer-events-none disabled:opacity-50'

const SELECTED =
  'border-stroke-soft-200 bg-[var(--color-brand-sky-wash)] text-text-sub-600'

export function ChoiceChip({
  selected,
  onToggle,
  onRemove,
  removeLabel,
  selectedClassName = SELECTED,
  disabled,
  mode = 'toggle',
  children,
}: {
  selected: boolean
  onToggle: () => void
  onRemove?: () => void
  removeLabel?: string
  selectedClassName?: string
  disabled?: boolean
  mode?: 'toggle' | 'radio'
  children: React.ReactNode
}) {
  const tone = selected
    ? selectedClassName
    : 'border-stroke-soft-200 text-text-sub-600 fine-hover:border-stroke-sub-300 fine-hover:text-text-strong-950'

  if (!onRemove) {
    return (
      <button
        type="button"
        {...(mode === 'radio' ? { role: 'radio', 'aria-checked': selected } : { 'aria-pressed': selected })}
        onClick={onToggle}
        disabled={disabled}
        className={cn(chipClass, 'px-3', tone)}
      >
        {children}
      </button>
    )
  }

  return (
    <span className={cn(chipClass, 'pr-1 pl-3', tone)}>
      <button
        type="button"
        {...(mode === 'radio' ? { role: 'radio', 'aria-checked': selected } : { 'aria-pressed': selected })}
        onClick={onToggle}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary-base"
      >
        {children}
      </button>
      <button
        type="button"
        aria-label={removeLabel ?? 'Remove'}
        onClick={onRemove}
        disabled={disabled}
        className="inline-flex size-5 items-center justify-center rounded-full text-text-soft-400 outline-none focus-visible:ring-2 focus-visible:ring-primary-base fine-hover:bg-bg-white-0 fine-hover:text-text-sub-600"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </span>
  )
}
