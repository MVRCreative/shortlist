'use client'

import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { CopyButton } from '@/components/gtm/copy-button'
import type { Digest } from '@/lib/gtm/schemas'
import { cn } from '@/lib/utils'

type Lead = Digest['leads'][number]

const EASE_OUT = 'ease-[cubic-bezier(0.23,1,0.32,1)]'

export function DoneCheck({ done, label, onToggle }: { done: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={`Mark ${label} as done`}
      onClick={onToggle}
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,transform] duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        EASE_OUT,
        done ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-muted-foreground',
      )}
    >
      <Check
        className={cn('size-3 stroke-[3] transition-[opacity,transform] duration-150', EASE_OUT, done ? 'scale-100 opacity-100' : 'scale-75 opacity-0')}
        aria-hidden="true"
      />
    </button>
  )
}

function LeadRow({
  lead,
  index,
  done,
  expanded,
  showMessage,
  onToggleDone,
  onToggleExpanded,
}: {
  lead: Lead
  index: number
  done: boolean
  expanded: boolean
  showMessage: boolean
  onToggleDone: () => void
  onToggleExpanded: () => void
}) {
  const panelId = `lead-panel-${index}`

  return (
    <li className="group/row">
      <div className="flex items-center gap-3 px-3">
        <DoneCheck done={done} label={lead.contactName} onToggle={onToggleDone} />
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onToggleExpanded}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className={cn('flex min-w-0 flex-1 flex-col gap-0.5 transition-opacity duration-150', done && 'opacity-50')}>
            <p className="truncate text-label">
              <span className={cn(done && 'line-through decoration-muted-foreground/60')}>{lead.contactName}</span>
              <span className="font-normal text-muted-foreground">
                {' · '}
                {lead.title}
              </span>
            </p>
            <p className="truncate text-meta">
              {lead.company}
              <span aria-hidden="true"> · </span>
              <span className="text-foreground/80">{lead.signal}</span>
            </p>
          </div>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
              EASE_OUT,
              expanded && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </button>
      </div>

      <div
        id={panelId}
        className={cn('grid transition-[grid-template-rows] duration-200', EASE_OUT, expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
        inert={!expanded}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-3 pr-3 pb-4 pl-11">
            <p className="text-description text-pretty">{lead.angle}</p>
            {showMessage ? (
              <div className="flex flex-col gap-1 rounded-lg border border-border bg-background px-3 pt-3 pb-1.5">
                <p className="whitespace-pre-line text-body text-pretty">{lead.message}</p>
                <div className="-mr-1.5 flex items-center justify-between">
                  <span className="text-meta">
                    {lead.domain}
                  </span>
                  <CopyButton text={lead.message} label="Copy note" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  )
}

export function LeadListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card" aria-busy="true" aria-label="Loading accounts">
      {Array.from({ length: Math.min(rows, 5) }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3.5">
          <Skeleton className="size-5 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function LeadList({
  leads,
  completed,
  showMessages,
  onToggle,
}: {
  leads: Lead[]
  completed: Set<string>
  showMessages: boolean
  onToggle: (key: string) => void
}) {
  const [expanded, setExpanded] = useState<number | null>(() => {
    const firstOpen = leads.findIndex((_, i) => !completed.has(`lead-${i}`))
    return firstOpen === -1 ? null : firstOpen
  })

  return (
    <ol className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
      {leads.map((lead, i) => {
        const key = `lead-${i}`
        return (
          <LeadRow
            key={key}
            lead={lead}
            index={i}
            done={completed.has(key)}
            expanded={expanded === i}
            showMessage={showMessages}
            onToggleDone={() => {
              if (!completed.has(key) && expanded === i) setExpanded(null)
              onToggle(key)
            }}
            onToggleExpanded={() => setExpanded((cur) => (cur === i ? null : i))}
          />
        )
      })}
    </ol>
  )
}
