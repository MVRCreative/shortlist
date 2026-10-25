'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { AccountActions } from '@/components/shortlist/account-actions'
import { CopyButton } from '@/components/shortlist/copy-button'
import { DoneCheck } from '@/components/shortlist/done-check'
import type { Digest } from '@/lib/shortlist/schemas'
import { cn } from '@/lib/utils'

type Lead = Digest['leads'][number]

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
  const n = String(index + 1).padStart(2, '0')

  return (
    <li
      className={cn(
        'rounded-20 border border-stroke-soft-200 bg-bg-white-0 transition-[box-shadow,background-color] duration-200',
        expanded ? 'shadow-[var(--elevation-card)]' : 'fine-hover:bg-bg-weak-50/40',
        done && !expanded && 'opacity-55',
      )}
    >
      <div className="flex items-start gap-3 px-3 py-3.5 sm:px-4">
        <DoneCheck done={done} label={lead.contactName} onToggle={onToggleDone} />
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onToggleExpanded}
          className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base"
        >
          <span className="mt-0.5 font-mono text-paragraph-xs tabular-nums text-text-sub-600">{n}</span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="truncate text-paragraph-sm font-medium text-text-strong-950">
              <span className={cn(done && 'line-through decoration-foreground/25')}>{lead.contactName}</span>
            </p>
            <p className="truncate text-paragraph-xs text-text-sub-600">
              {lead.title}
              <span aria-hidden="true"> · </span>
              <span className="text-text-strong-950/80">{lead.company}</span>
            </p>
            <p className="truncate text-paragraph-xs text-text-sub-600">{lead.signal}</p>
          </div>
          <ChevronDown
            className={cn(
              'mt-1 size-4 shrink-0 text-text-sub-600 transition-transform duration-200 ease-out',
              expanded && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </button>
      </div>

      {expanded ? (
        <div id={panelId} className="flex flex-col gap-4 border-t border-stroke-soft-200 px-3 pt-3 pb-4 sm:px-4">
          <div className="pl-7 sm:pl-11">
            <p className="text-paragraph-xs font-medium uppercase tracking-caps text-text-sub-600">Why now</p>
            <p className="mt-1.5 text-paragraph-sm text-pretty text-text-strong-950">{lead.angle}</p>
          </div>
          <div className="pl-7 sm:pl-11">
            <p className="text-paragraph-xs font-medium uppercase tracking-caps text-text-sub-600">Reach out</p>
            <AccountActions
              className="mt-2"
              email={lead.email}
              domain={lead.domain}
              linkedinUrl={lead.linkedinUrl}
              contactName={lead.contactName}
              company={lead.company}
            />
          </div>
          {showMessage ? (
            <div className="rounded-lg bg-bg-weak-50/70 px-3 py-3 sm:ml-11 sm:px-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-paragraph-xs font-medium uppercase tracking-caps text-text-sub-600">Note</p>
                <CopyButton text={lead.message} label="Copy note" iconOnly />
              </div>
              <p className="mt-2 whitespace-pre-line text-paragraph-sm text-pretty text-text-strong-950">{lead.message}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

export function LeadListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading accounts">
      {Array.from({ length: Math.min(rows, 5) }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-20 border border-stroke-soft-200/60 px-4 py-3.5">
          <Skeleton className="size-4 rounded-[3px]" />
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
    <ol className="flex flex-col gap-2">
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
