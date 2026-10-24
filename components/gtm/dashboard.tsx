'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ContentPanel } from '@/components/gtm/content-panel'
import { CopyButton } from '@/components/gtm/copy-button'
import { DashboardNav } from '@/components/gtm/dashboard-nav'
import { LeadList, LeadListSkeleton } from '@/components/gtm/lead-list'
import { NextDigestCountdown } from '@/components/gtm/next-digest-countdown'
import type { Digest, DigestSettings, ProfileInput } from '@/lib/gtm/schemas'

export function Dashboard({
  digest,
  settings,
  input,
  isDemo,
  pending,
  onNextWeek,
  onProfile,
  onSettings,
}: {
  digest: Digest | null
  settings: DigestSettings
  input: ProfileInput
  isDemo: boolean
  pending: boolean
  onNextWeek: () => void
  onProfile: () => void
  onSettings: () => void
}) {
  const [completed, setCompleted] = useState<Set<string>>(() => new Set())

  function toggle(key: string) {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const leadCount = digest?.leads.length ?? settings.leadsPerDigest
  const leadsDone = [...completed].filter((key) => key.startsWith('lead-')).length

  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-6xl gap-x-10 px-4 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_18rem]">
      <aside className="lg:sticky lg:top-0 lg:row-span-2 lg:h-dvh">
        <DashboardNav
          isDemo={isDemo}
          companyName={input.companyName}
          website={input.website}
          leadsProgress={`${leadsDone}/${leadCount}`}
          pending={pending}
          onLeads={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onContent={() => document.getElementById('content')?.scrollIntoView({ behavior: 'smooth' })}
          onProfile={onProfile}
          onSettings={onSettings}
          onNextWeek={onNextWeek}
        />
      </aside>

      <main className="flex min-w-0 flex-col gap-8 pt-2 pb-16 lg:pt-6">
        <NextDigestCountdown
          cadence={settings.cadence}
          leadsPerDigest={settings.leadsPerDigest}
          email={settings.email}
        />

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="success">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
              Live
            </Badge>
            <p className="text-meta">
              {input.companyName}’s {settings.cadence} digest · {format(new Date(), 'MMM d')}
            </p>
          </div>
          <h1 className="text-lg font-medium tracking-tight text-balance">
            {digest ? `${digest.theme}.` : 'Writing your first digest.'}
          </h1>
        </div>

        <section aria-labelledby="leads-heading" className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="leads-heading" className="text-label whitespace-nowrap">
                  {leadCount} leads
                </h2>
                <p className="text-meta tabular whitespace-nowrap">
                  {leadsDone} of {leadCount} completed
                </p>
              </div>
              <Progress value={(leadsDone / Math.max(leadCount, 1)) * 100} className="h-1" aria-label="Leads completed" />
            </div>
            {digest ? (
              <CopyButton
                label="Copy all"
                text={digest.leads
                  .map((l) => `${l.contactName}, ${l.title} @ ${l.company} (${l.domain})\n${l.message}`)
                  .join('\n\n')}
              />
            ) : null}
          </div>
          {digest ? (
            <LeadList
              leads={digest.leads}
              completed={completed}
              showMessages={settings.channels.includes('linkedinMessage')}
              onToggle={toggle}
            />
          ) : (
            <LeadListSkeleton rows={settings.leadsPerDigest} />
          )}
        </section>
      </main>

      <aside className="pb-10 lg:col-start-2 xl:sticky xl:top-0 xl:col-start-3 xl:row-start-1 xl:max-h-dvh xl:overflow-y-auto xl:pt-6">
        <ContentPanel digest={digest} channels={settings.channels} completed={completed} onToggle={toggle} />
      </aside>
    </div>
  )
}
