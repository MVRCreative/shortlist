'use client'

import { format } from 'date-fns'
import { ContentPanel } from '@/components/gtm/content-panel'
import { CopyButton } from '@/components/gtm/copy-button'
import { DashboardNav } from '@/components/gtm/dashboard-nav'
import { LeadList, LeadListSkeleton } from '@/components/gtm/lead-list'
import { NextDigestCountdown } from '@/components/gtm/next-digest-countdown'
import type { Digest, DigestSettings, ProfileInput } from '@/lib/gtm/schemas'
import { studioName } from '@/lib/gtm/url'

export function Dashboard({
  digest,
  settings,
  input,
  isDemo,
  completed,
  onToggle,
  onProfile,
  onSettings,
  onSignOut,
}: {
  digest: Digest | null
  settings: DigestSettings
  input: ProfileInput
  isDemo: boolean
  completed: Set<string>
  onToggle: (key: string) => void
  onProfile: () => void
  onSettings: () => void
  onSignOut: () => void
}) {
  const accountCount = digest?.leads.length ?? settings.leadsPerDigest
  const accountsDone = [...completed].filter((key) => key.startsWith('lead-')).length
  const cadenceLabel = settings.cadence === 'weekly' ? 'Weekly' : 'Monthly'

  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-6xl gap-x-10 px-4 sm:px-6 lg:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-[12rem_minmax(0,1fr)_18rem]">
      <aside className="lg:sticky lg:top-0 lg:row-span-2 lg:h-dvh">
        <DashboardNav
          isDemo={isDemo}
          companyName={studioName(input)}
          website={input.website}
          accountsProgress={`${accountsDone}/${accountCount}`}
          onAccounts={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onContent={() => document.getElementById('content')?.scrollIntoView({ behavior: 'smooth' })}
          onProfile={onProfile}
          onSettings={onSettings}
          onSignOut={onSignOut}
        />
      </aside>

      <main className="flex min-w-0 flex-col gap-8 pt-2 pb-16 lg:pt-8">
        <header className="flex flex-col gap-2">
          <p className="flex items-center gap-2 text-meta">
            <span className="size-1.5 rounded-full bg-status-success-fg" aria-hidden="true" />
            <span>
              {cadenceLabel} digest · {format(new Date(), 'MMM d')}
            </span>
          </p>
          <h1 className="text-lg font-medium tracking-tight text-balance">
            {digest ? `${digest.theme}.` : 'Writing your first digest.'}
          </h1>
          <NextDigestCountdown
            cadence={settings.cadence}
            leadsPerDigest={settings.leadsPerDigest}
            email={settings.email}
          />
        </header>

        <section aria-labelledby="accounts-heading" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <h2 id="accounts-heading" className="flex items-baseline gap-2 text-label">
              Accounts
              <span className="text-meta font-normal tabular-nums">
                {accountsDone} of {accountCount} done
              </span>
            </h2>
            {digest ? (
              <div className="-mr-2">
                <CopyButton
                  label="Copy all"
                  text={digest.leads
                    .map((l) => `${l.contactName}, ${l.title} @ ${l.company} (${l.domain})\n${l.message}`)
                    .join('\n\n')}
                />
              </div>
            ) : null}
          </div>
          {digest ? (
            <LeadList
              leads={digest.leads}
              completed={completed}
              showMessages={settings.channels.includes('linkedinMessage')}
              onToggle={onToggle}
            />
          ) : (
            <LeadListSkeleton rows={settings.leadsPerDigest} />
          )}
        </section>
      </main>

      <aside className="pb-10 lg:col-start-2 xl:sticky xl:top-0 xl:col-start-3 xl:row-start-1 xl:max-h-dvh xl:overflow-y-auto xl:pt-8">
        <ContentPanel digest={digest} channels={settings.channels} completed={completed} onToggle={onToggle} />
      </aside>
    </div>
  )
}
