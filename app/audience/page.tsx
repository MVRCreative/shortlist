'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageSkeleton } from '@/components/shortlist/page-skeleton'
import { AppShell } from '@/components/shortlist/app-shell'
import { AudienceForm } from '@/components/shortlist/audience-form'
import { ListBadge, ListEmpty, ListHeader, ListRow, ListRows } from '@/components/shortlist/list-page'
import { AccountRow } from '@/components/shortlist/match-step'
import { useShortlist } from '@/components/shortlist/shortlist-provider'
import { Button } from '@/components/ui/button'
import { studioName } from '@/lib/shortlist/url'

function summarize(...groups: string[][]) {
  return groups
    .map((group) => group.slice(0, 2).join(', '))
    .filter(Boolean)
    .join(' · ')
}

export default function AudiencePage() {
  const {
    hydrated,
    input,
    accounts,
    verdicts,
    isDemo,
    handleVerdict,
    handleFindAccounts,
    handleSignOut,
    pending,
    enriched,
    audiences,
    addAudience,
    removeAudience,
  } = useShortlist()
  const [creating, setCreating] = useState(false)

  if (!hydrated) return <PageSkeleton />

  const primarySummary = summarize(input.industries, input.buyerTitles, input.regions)
  const hasPrimary = primarySummary.length > 0
  const total = audiences.length + (hasPrimary ? 1 : 0)
  const rated = accounts.filter((account) => verdicts[account.id]).length

  return (
    <AppShell
      isDemo={isDemo}
      companyName={studioName(input)}
      website={input.website}
      onSignOut={handleSignOut}
      mainClassName="max-w-3xl gap-6 px-4 pt-8 sm:px-6 lg:px-8"
    >
      <ListHeader
        title="Audiences"
        actionLabel={creating || total === 0 ? undefined : 'New audience'}
        onAction={() => setCreating(true)}
      />

      {creating ? (
        <AudienceForm
          onCancel={() => setCreating(false)}
          onSave={(values) => {
            addAudience(values)
            setCreating(false)
          }}
        />
      ) : null}

      {total > 0 ? (
        <ListRows>
          {hasPrimary ? (
            <ListRow
              title="Primary audience"
              meta={primarySummary}
              badge={<ListBadge>Primary</ListBadge>}
              actions={
                <Button type="button" variant="ghost" size="sm" asChild>
                  <Link href="/onboarding/profile">Edit</Link>
                </Button>
              }
            />
          ) : null}
          {audiences.map((audience) => (
            <ListRow
              key={audience.id}
              title={audience.name}
              meta={summarize(audience.industries, audience.buyerTitles, audience.regions)}
              onRemove={() => removeAudience(audience.id)}
            />
          ))}
        </ListRows>
      ) : !creating ? (
        <ListEmpty title="No audiences yet" actionLabel="Create audience" onAction={() => setCreating(true)} />
      ) : null}

      {enriched ? (
        <section className="flex flex-col gap-3 pt-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="section-title">Review matches</h2>
            <div className="flex items-center gap-3">
              {accounts.length > 0 ? (
                <p className="text-paragraph-xs tabular-nums text-text-sub-600" aria-live="polite">
                  {rated}/{accounts.length} rated
                </p>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleFindAccounts}
                pending={pending === 'match'}
              >
                {pending === 'match' ? 'Finding…' : accounts.length > 0 ? 'Refresh' : 'Find matches'}
              </Button>
            </div>
          </div>
          {accounts.length > 0 ? (
            <ListRows>
              {accounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  verdict={verdicts[account.id]}
                  onVerdict={(verdict) => handleVerdict(account.id, verdict)}
                />
              ))}
            </ListRows>
          ) : null}
        </section>
      ) : null}
    </AppShell>
  )
}
