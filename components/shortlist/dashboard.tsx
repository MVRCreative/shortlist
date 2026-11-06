'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { AppShell } from '@/components/shortlist/app-shell'
import { ContentPanel } from '@/components/shortlist/content-panel'
import { CopyButton } from '@/components/shortlist/copy-button'
import { DigestSettingsPanel } from '@/components/shortlist/digest-settings-panel'
import { LeadList, LeadListSkeleton } from '@/components/shortlist/lead-list'
import { NextDigestCountdown } from '@/components/shortlist/next-digest-countdown'
import { ProfileCard } from '@/components/shortlist/profile-preview'
import { useCampaignContent } from '@/components/shortlist/use-campaign-content'
import type { Digest, DigestSettings, EnrichedProfile, ProfileInput } from '@/lib/shortlist/schemas'
import { studioName } from '@/lib/shortlist/url'

export type DashboardView = 'digest' | 'profile' | 'plan'

export function Dashboard({
  view,
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
  view: DashboardView
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
  const campaign = useCampaignContent({ profile: input, enriched, digest })
  const accountCount = digest?.leads.length ?? settings.leadsPerDigest
  const accountsDone = [...completed].filter((key) => key.startsWith('lead-')).length
  const cadenceLabel = settings.cadence === 'weekly' ? 'Weekly' : 'Monthly'

  const contentPanelProps = {
    digest,
    channels: settings.channels,
    content: campaign.content,
    draft: campaign.draft,
    published: campaign.published,
    onEdit: campaign.update,
    onTogglePublished: campaign.togglePublished,
  }

  return (
    <AppShell
      isDemo={isDemo}
      companyName={studioName(input)}
      website={input.website}
      onSignOut={onSignOut}
      aside={view === 'digest' ? <ContentPanel {...contentPanelProps} /> : undefined}
    >
      {view === 'profile' ? (
        <SubPage title="Profile">
          <ProfileCard input={input} enriched={enriched} fitCount={fitCount} missCount={missCount} />
        </SubPage>
      ) : view === 'plan' ? (
        <SubPage title="Plan">
          <DigestSettingsPanel settings={settings} />
        </SubPage>
      ) : (
        <>
          <header className="flex flex-col gap-3 border-b border-stroke-soft-200 px-4 pt-8 pb-8 sm:px-6 lg:px-8">
            <p className="kicker">
              {cadenceLabel} digest · {format(new Date(), 'MMM d')}
            </p>
            <h1 className="page-title">{digest ? digest.theme : 'Writing your first digest'}</h1>
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
            <ContentPanel sectionId="campaign-content-mobile" {...contentPanelProps} />
          </div>
        </>
      )}
    </AppShell>
  )
}

function SubPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby="subpage-heading" className="flex max-w-xl flex-col gap-4 px-4 pt-8 sm:px-6 lg:px-8">
      <div className="flex items-baseline justify-between gap-3">
        <h1 id="subpage-heading" className="page-title">
          {title}
        </h1>
        <Link
          href="/digest"
          className="rounded-md text-paragraph-xs text-text-sub-600 transition-colors duration-150 ease-out focus-ring fine-hover:hover:text-text-strong-950"
        >
          Back to digest
        </Link>
      </div>
      {children}
    </section>
  )
}
