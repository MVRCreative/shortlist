import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Quiet done mark — hairline square, check appears in deep blue.
 * Strike on the label carries most of the state; this is the affordance.
 */
export function DoneCheck({
  done,
  label,
  verb = 'done',
  onToggle,
}: {
  done: boolean
  label: string
  /** What the check means. Campaign content uses "published" so a check is the member's confirmation. */
  verb?: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `Mark ${label} as not ${verb}` : `Mark ${label} as ${verb}`}
      onClick={onToggle}
      className={cn(
        'press mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-4 border transition-[border-color,background-color,color] duration-150',
        'focus-ring',
        done
          ? 'border-primary-base bg-primary-base text-static-white'
          : 'border-stroke-soft-200 text-transparent fine-hover:hover:border-stroke-sub-300',
      )}
    >
      <Check className={cn('size-2.5 stroke-[2.5]', done ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
    </button>
  )
}
