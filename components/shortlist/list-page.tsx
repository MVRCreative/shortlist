import type { ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ListHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h1 className="page-title">{title}</h1>
      {actionLabel && onAction ? (
        <Button type="button" onClick={onAction}>
          <Plus className="size-4" aria-hidden="true" />
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

export function ListEmpty({
  title,
  actionLabel,
  onAction,
}: {
  title: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-20 border border-dashed border-stroke-soft-200 px-6 py-14 text-center">
      <p className="text-label-sm text-text-sub-600">{title}</p>
      <Button type="button" variant="secondary" onClick={onAction}>
        <Plus className="size-4" aria-hidden="true" />
        {actionLabel}
      </Button>
    </div>
  )
}

export function ListRows({ children }: { children: ReactNode }) {
  return (
    <div className="surface-group">
      <ul className="divide-y divide-stroke-soft-200">{children}</ul>
    </div>
  )
}

export function ListRow({
  title,
  meta,
  badge,
  actions,
  onRemove,
}: {
  title: string
  meta?: string
  badge?: ReactNode
  actions?: ReactNode
  onRemove?: () => void
}) {
  return (
    <li className="flex items-center gap-4 px-4 py-3 sm:px-5">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <p className="truncate text-label-sm text-text-strong-950">{title}</p>
          {badge}
        </div>
        {meta ? <p className="truncate text-paragraph-xs text-text-sub-600">{meta}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {actions}
        {onRemove ? (
          <Button type="button" variant="ghost" size="sm" icon onClick={onRemove} aria-label={`Delete ${title}`}>
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </li>
  )
}

export function ListBadge({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded-full bg-bg-weak-50 px-2 py-0.5 text-paragraph-xs text-text-sub-600">
      {children}
    </span>
  )
}
