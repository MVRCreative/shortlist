import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Quiet done mark — hairline square, check appears in deep blue.
 * Strike on the label carries most of the state; this is the affordance.
 */
export function DoneCheck({ done, label, onToggle }: { done: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `Mark ${label} as not done` : `Mark ${label} as done`}
      onClick={onToggle}
      className={cn(
        'press mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[3px] border transition-[border-color,background-color,color] duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base focus-visible:ring-offset-2 focus-visible:ring-offset-bg-white-0',
        done
          ? 'border-primary-base bg-primary-base text-static-white'
          : 'border-stroke-soft-200 text-transparent fine-hover:border-stroke-sub-300',
      )}
    >
      <Check className={cn('size-2.5 stroke-[2.5]', done ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
    </button>
  )
}
