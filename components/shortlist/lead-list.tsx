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

/** Emphasized ease-out from the motion tokens. Dropdowns stay inside 200ms. */
const openEase = 'duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none'

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
  const fit = memberNote(lead.fitReason ?? '')
  const angle = memberNote(lead.angle ?? '')
  const signal = memberNote(lead.signal ?? '')
  const showFit = fit.length > 0 && fit !== signal
  const extraAngle = angle.length > 0 && angle !== signal && angle !== fit
  const looksLikeAngle = /^(reference|lead with|open with|short note|congratulate)/i.test(angle)
  const about = extraAngle && !looksLikeAngle ? angle : ''
  const showAngle = Boolean(extraAngle && looksLikeAngle)
  const canReach = Boolean(
    (lead.email && lead.email.includes('@')) ||
      lead.domain?.trim() ||
      (lead.linkedinUrl && !lead.linkedinUrl.includes('/search')),
  )

  return (
    <li
      className={cn(
        'relative border-b border-stroke-soft-200 transition-colors last:border-b-0',
        openEase,
        expanded && 'surface-selected',
      )}
    >
      {/* Painted accent, not a border, so the type does not shift when the row opens. */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-sky transition-opacity',
          openEase,
          expanded ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div className="flex items-start gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
        <DoneCheck done={done} label={lead.contactName} onToggle={onToggleDone} />
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onToggleExpanded}
          className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base"
        >
          <span className="kicker mt-0.5 tabular-nums">{n}</span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="truncate text-paragraph-sm font-normal text-text-strong-950">
              <span className={cn(done && 'line-through decoration-text-sub-600/40')}>{lead.contactName}</span>
            </p>
            <p className="truncate text-paragraph-xs text-text-sub-600">
              {lead.title}
              <span aria-hidden="true"> · </span>
              <span className="text-text-strong-950/80">{lead.company}</span>
            </p>
            {signal ? <p className="truncate text-paragraph-xs text-text-sub-600">{signal}</p> : null}
          </div>
          <ChevronDown
            className={cn(
              'mt-1 size-4 shrink-0 text-text-sub-600 transition-transform',
              openEase,
              expanded && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </button>
      </div>

      <div
        id={panelId}
        role="region"
        aria-label={`${lead.contactName} details`}
        inert={expanded ? undefined : true}
        aria-hidden={expanded ? undefined : true}
        className={cn(
          'grid transition-[grid-template-rows,opacity]',
          openEase,
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-5 border-t border-stroke-soft-200 px-4 pt-4 pb-5 sm:px-6 lg:px-8">
            {showFit ? (
              <Detail label="Why they fit">
                <p className="text-paragraph-sm text-pretty text-text-strong-950">{fit}</p>
              </Detail>
            ) : null}
            {about ? (
              <Detail label="About them">
                <p className="text-paragraph-sm text-pretty text-text-strong-950">{about}</p>
              </Detail>
            ) : null}
            {showAngle ? (
              <Detail label="How to open">
                <p className="text-paragraph-sm text-pretty text-text-strong-950">{angle}</p>
              </Detail>
            ) : null}
            {canReach ? (
              <Detail label="Reach them">
                <AccountActions
                  email={lead.email}
                  domain={lead.domain}
                  linkedinUrl={lead.linkedinUrl}
                  contactName={lead.contactName}
                  company={lead.company}
                />
              </Detail>
            ) : null}
            {showMessage && isOutreachDraft(lead.message) ? (
              <div className="ml-7 bg-bg-soft-200/50 px-3 py-3 sm:ml-11 sm:px-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="kicker">What you could say</p>
                  <CopyButton text={lead.message} label="Copy message" iconOnly />
                </div>
                <p className="mt-2 whitespace-pre-line text-paragraph-sm text-pretty text-text-strong-950">
                  {lead.message}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  )
}

/** Drop provider miss notes so an internal failure is never shown as outreach copy. */
function memberNote(text: string) {
  const cleaned = text
    .replace(/no dated signal from ocean/gi, 'No dated buying signal')
    .replace(/\b(no_provider_\w+|role_mismatch)\b/gi, '')
    .replace(/Deepline found people, but none matched the buyer titles\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (/\b(Ocean|Deepline)\b/.test(cleaned)) return ''
  return cleaned
}

/** Internal miss notes are not something the member can send. */
function isOutreachDraft(message: string) {
  const text = message.trim()
  if (!text) return false
  if (/no_provider_|role_mismatch|miss_code/i.test(text)) return false
  if (/^No note for\b/i.test(text)) return false
  return true
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pl-7 sm:pl-11">
      <p className="kicker">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

export function LeadListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="border-t border-stroke-soft-200" aria-busy="true" aria-label="Loading accounts">
      {Array.from({ length: Math.min(rows, 5) }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-stroke-soft-200 px-4 py-3.5 last:border-b-0 sm:px-6 lg:px-8">
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
    <ol className="border-t border-stroke-soft-200">
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
