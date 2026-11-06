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
import { useCampaignContent } from '@/components/shortlist/use-campaign-content'
import type { Digest, DigestSettings, EnrichedProfile, ProfileInput } from '@/lib/shortlist/schemas'
import { studioName } from '@/lib/shortlist/url'
import { cn } from '@/lib/utils'

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
  const campaign = useCampaignContent({ profile: input, enriched, digest })
  const accountCount = digest?.leads.length ?? settings.leadsPerDigest
  const accountsDone = [...completed].filter((key) => key.startsWith('lead-')).length
  const cadenceLabel = settings.cadence === 'weekly' ? 'Weekly' : 'Monthly'

  return (
    <div
      className={cn(
        'mx-auto grid min-h-dvh w-full max-w-5xl lg:grid-cols-[11rem_minmax(0,1fr)]',
        menu === 'none' && 'xl:grid-cols-[11rem_minmax(0,1fr)_18rem]',
      )}
    >
      <aside className="lg:border-r lg:border-stroke-soft-200">
        <div className="lg:sticky lg:top-0 lg:max-h-dvh lg:overflow-y-auto">
          <DashboardNav
            isDemo={isDemo}
            companyName={studioName(input)}
            website={input.website}
            menu={menu}
            onMenuChange={setMenu}
            onSignOut={onSignOut}
          />
        </div>
      </aside>

      <main className="flex min-w-0 flex-col pb-20">
        {menu === 'profile' ? (
          <section aria-labelledby="profile-heading" className="flex max-w-md flex-col gap-4 px-4 pt-8 sm:px-6 lg:px-8">
            <div className="flex items-baseline justify-between gap-3">
              <h1 id="profile-heading" className="page-title">
                Profile
              </h1>
              <button
                type="button"
                onClick={() => setMenu('none')}
                className="text-paragraph-xs text-text-sub-600 fine-hover:hover:text-text-strong-950"
              >
                Back to digest
              </button>
            </div>
            <ProfileCard input={input} enriched={enriched} fitCount={fitCount} missCount={missCount} />
          </section>
        ) : menu === 'settings' ? (
          <section className="flex max-w-md flex-col gap-4 px-4 pt-8 sm:px-6 lg:px-8">
            <div className="flex items-baseline justify-between gap-3">
              <h1 className="page-title">Plan</h1>
              <button
                type="button"
                onClick={() => setMenu('none')}
                className="text-paragraph-xs text-text-sub-600 fine-hover:hover:text-text-strong-950"
              >
                Back to digest
              </button>
            </div>
            <DigestSettingsPanel settings={settings} />
          </section>
        ) : (
          <>
            <header className="flex flex-col gap-3 border-b border-stroke-soft-200 px-4 pt-8 pb-8 sm:px-6 lg:px-8">
              <p className="kicker">
                {cadenceLabel} digest · {format(new Date(), 'MMM d')}
              </p>
              <h1 className="page-title">
                {digest ? digest.theme : 'Writing your first digest'}
              </h1>
              <NextDigestCountdown
                cadence={settings.cadence}
                leadsPerDigest={settings.leadsPerDigest}
                email={settings.email}
              />
            </header>

            <section aria-labelledby="accounts-heading" className="flex flex-col">
              <div className="flex items-end justify-between gap-4 px-4 pt-10 pb-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-1">
                  <h2 id="accounts-heading" className="section-title">
                    Accounts
                  </h2>
                  <p className="text-paragraph-xs text-text-sub-600">
                    <span className="font-medium tabular-nums text-text-strong-950">
                      {accountsDone}/{accountCount}
                    </span>{' '}
                    done · open one for why they fit and what to say
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
                        if (l.message.trim()) lines.push('', l.message)
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

            <div className="pt-10 xl:hidden">
              <ContentPanel
                sectionId="campaign-content-mobile"
                digest={digest}
                channels={settings.channels}
                content={campaign.content}
                draft={campaign.draft}
                published={campaign.published}
                onEdit={campaign.update}
                onTogglePublished={campaign.togglePublished}
              />
            </div>
          </>
        )}
      </main>

      {menu === 'none' ? (
        <aside className="hidden xl:block xl:border-l xl:border-stroke-soft-200">
          <div className="xl:sticky xl:top-0 xl:max-h-dvh xl:overflow-y-auto xl:pt-8 xl:pb-16">
            <ContentPanel
              digest={digest}
              channels={settings.channels}
              content={campaign.content}
              draft={campaign.draft}
              published={campaign.published}
              onEdit={campaign.update}
              onTogglePublished={campaign.togglePublished}
            />
          </div>
        </aside>
      ) : null}
    </div>
  )
}
