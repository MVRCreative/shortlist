import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Requirement = { key: string; label: string; done: boolean; section: string }

export function RequirementsChecklist({
  id,
  items,
  highlight,
}: {
  id: string
  items: Requirement[]
  highlight: boolean
}) {
  const doneCount = items.filter((item) => item.done).length

  return (
    <div id={id} className="flex flex-col gap-3" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <p className="text-label-sm text-text-strong-950">
          {doneCount === items.length ? 'Ready to build' : 'Before we build'}
        </p>
        <p className="text-paragraph-xs tabular-nums">
          {doneCount} of {items.length}
        </p>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-bg-soft-200" aria-hidden="true">
        <div
          className="h-full rounded-full bg-primary-base transition-[width] duration-200 ease-out"
          style={{ width: `${(doneCount / items.length) * 100}%` }}
        />
      </div>
      <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.key}
            className={cn(
              'flex items-center gap-2 text-paragraph-xs',
              item.done
                ? 'text-text-soft-400'
                : highlight
                  ? 'text-error-base'
                  : 'text-text-sub-600',
            )}
          >
            <span
              className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded-full border',
                item.done ? 'border-transparent bg-success-base text-static-white' : 'border-stroke-sub-300',
                !item.done && highlight && 'border-error-base',
              )}
              aria-hidden="true"
            >
              {item.done ? <Check className="size-2.5" strokeWidth={3} /> : null}
            </span>
            <span className={item.done ? 'line-through decoration-text-soft-400/50' : undefined}>
              {item.label}
              <span className="sr-only">{item.done ? ' (done)' : ' (needed)'}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
