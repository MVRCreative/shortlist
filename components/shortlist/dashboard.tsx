'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ContentPanel } from '@/components/shortlist/content-panel'
import { CopyButton } from '@/components/shortlist/copy-button'
import { DashboardNav, type DigestMenu } from '@/components/shortlist/dashboard-nav'
import { DigestSettingsPanel } from '@/components/shortlist/digest-settings-panel'
import { LeadList, LeadListSkeleton } from '@/components/shortlist/lead-list'
import { NextDigestCountdown } from '@/components/shortlist/next-digest-countdown'
import { ProfileCard } from '@/components/shortlist/profile-preview'
import type { Digest, DigestSettings, EnrichedProfile, ProfileInput } from '@/lib/shortlist/schemas'
import { studioName } from '@/lib/shortlist/url'

export function Dashboard({
  digest,
  settings,
  input,
  enriched,
  fitCount,
  missCount,
  isDemo,
  completed,
  onToggle,
  onSignOut,
}: {
  digest: Digest | null
  settings: DigestSettings
  input: ProfileInput
  enriched: EnrichedProfile | null
  fitCount: number
  missCount: number
  isDemo: boolean
  completed: Set<string>
  onToggle: (key: string) => void
  onSignOut: () => void
}) {
  const [menu, setMenu] = useState<DigestMenu>('none')
  const accountCount = digest?.leads.length ?? settings.leadsPerDigest
  const accountsDone = [...completed].filter((key) => key.startsWith('lead-')).length
  const cadenceLabel = settings.cadence === 'weekly' ? 'Weekly' : 'Monthly'

  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-5xl gap-x-12 px-4 sm:px-6 lg:grid-cols-[9.5rem_minmax(0,1fr)] xl:grid-cols-[9.5rem_minmax(0,1fr)_18rem]">
      <aside className="lg:sticky lg:top-0 lg:h-dvh lg:self-start">
        <DashboardNav
          isDemo={isDemo}
          companyName={studioName(input)}
          website={input.website}
          menu={menu}
          onMenuChange={setMenu}
          onSignOut={onSignOut}
        />
      </aside>

      <main className="flex min-w-0 flex-col gap-12 pt-2 pb-20 lg:pt-8">
        {menu === 'profile' ? (
          <section aria-labelledby="profile-heading" className="flex max-w-md flex-col gap-4">
            <div className="flex items-baseline justify-between gap-3">
              <h1 id="profile-heading" className="text-title-h5 tracking-tight">
                Profile
              </h1>
              <button
                type="button"
                onClick={() => setMenu('none')}
                className="text-paragraph-xs text-text-sub-600 fine-hover:text-text-strong-950"
              >
                Back to digest
              </button>
            </div>
            <ProfileCard input={input} enriched={enriched} fitCount={fitCount} missCount={missCount} />
          </section>
        ) : menu === 'settings' ? (
          <section className="flex max-w-md flex-col gap-4">
            <div className="flex items-baseline justify-between gap-3">
              <h1 className="text-title-h5 tracking-tight">Plan</h1>
              <button
                type="button"
                onClick={() => setMenu('none')}
                className="text-paragraph-xs text-text-sub-600 fine-hover:text-text-strong-950"
              >
                Back to digest
              </button>
            </div>
            <DigestSettingsPanel settings={settings} />
          </section>
        ) : (
          <>
            <header className="flex flex-col gap-3 border-b border-stroke-soft-200 pb-8">
              <p className="text-paragraph-xs font-medium uppercase tracking-caps text-text-sub-600">
                {cadenceLabel} digest · {format(new Date(), 'MMM d')}
              </p>
              <h1 className="text-title-h5 text-balance tracking-tight">
                {digest ? digest.theme : 'Writing your first digest'}
              </h1>
              <NextDigestCountdown
                cadence={settings.cadence}
                leadsPerDigest={settings.leadsPerDigest}
                email={settings.email}
              />
            </header>

            <section aria-labelledby="accounts-heading" className="flex flex-col gap-4">
              <div className="flex items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h2 id="accounts-heading" className="text-label-sm">
                    Accounts
                  </h2>
                  <p className="text-paragraph-xs text-text-sub-600">
                    <span className="font-medium tabular-nums text-text-strong-950">
                      {accountsDone}/{accountCount}
                    </span>{' '}
                    done · open one, send the note
                  </p>
                </div>
                {digest ? (
                  <CopyButton
                    label="Copy all"
                    iconOnly
                    text={digest.leads
                      .map((l) => {
                        const lines = [`${l.contactName}, ${l.title} @ ${l.company}`]
                        if (l.domain) lines.push(`https://${l.domain}`)
                        if (l.linkedinUrl) lines.push(l.linkedinUrl)
                        if (l.email) lines.push(l.email)
                        lines.push('', l.message)
                        return lines.join('\n')
                      })
                      .join('\n\n')}
                  />
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

            <div className="border-t border-stroke-soft-200 pt-10 xl:hidden">
              <ContentPanel
                digest={digest}
                channels={settings.channels}
                completed={completed}
                onToggle={onToggle}
              />
            </div>
          </>
        )}
      </main>

      {menu === 'none' ? (
        <aside className="hidden xl:sticky xl:top-0 xl:block xl:max-h-dvh xl:self-start xl:overflow-y-auto xl:border-l xl:border-stroke-soft-200 xl:pt-8 xl:pr-0 xl:pb-16 xl:pl-8">
          <ContentPanel digest={digest} channels={settings.channels} completed={completed} onToggle={onToggle} />
        </aside>
      ) : null}
    </div>
  )
}
