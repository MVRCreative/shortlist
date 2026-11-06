'use client'

import Link from 'next/link'
import { DashboardNav } from '@/components/shortlist/dashboard-nav'
import { MatchStep } from '@/components/shortlist/match-step'
import { useShortlist } from '@/components/shortlist/shortlist-provider'
import { Button } from '@/components/ui/button'
import { studioName } from '@/lib/shortlist/url'

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
  } = useShortlist()

  if (!hydrated) return <div className="min-h-dvh" aria-busy="true" />

  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-5xl lg:grid-cols-[11rem_minmax(0,1fr)]">
      <aside className="lg:border-r lg:border-stroke-soft-200">
        <div className="lg:sticky lg:top-0 lg:max-h-dvh lg:overflow-y-auto">
          <DashboardNav
            isDemo={isDemo}
            companyName={studioName(input)}
            website={input.website}
            menu="none"
            onMenuChange={() => {}}
            onSignOut={handleSignOut}
          />
        </div>
      </aside>
      <main className="flex min-w-0 flex-col gap-6 px-4 pt-8 pb-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <p className="kicker">Audience</p>
          <h1 className="page-title">Who you want to reach</h1>
          <p className="max-w-xl text-paragraph-sm text-text-sub-600">
            Industries, buyers, sizes, regions, and example companies live here. Approve or reject real
            Ocean lookalikes before they influence discovery.
          </p>
        </div>

        <section className="flex flex-col gap-3 rounded-20 border border-stroke-soft-200 p-4">
          <h2 className="section-title">Targeting</h2>
          <dl className="grid gap-3 text-paragraph-sm sm:grid-cols-2">
            <div>
              <dt className="text-paragraph-xs text-text-sub-600">Industries</dt>
              <dd>{input.industries.join(', ') || '—'}</dd>
            </div>
            <div>
              <dt className="text-paragraph-xs text-text-sub-600">Company sizes</dt>
              <dd>{input.companySizes.join(', ') || '—'}</dd>
            </div>
            <div>
              <dt className="text-paragraph-xs text-text-sub-600">Regions</dt>
              <dd>{input.regions.join(', ') || '—'}</dd>
            </div>
            <div>
              <dt className="text-paragraph-xs text-text-sub-600">Buyers</dt>
              <dd>{input.buyerTitles.join(', ') || '—'}</dd>
            </div>
            <div>
              <dt className="text-paragraph-xs text-text-sub-600">Lookalike seeds (max 3)</dt>
              <dd>{input.seedClients.join(', ') || '—'}</dd>
            </div>
            <div>
              <dt className="text-paragraph-xs text-text-sub-600">Reference companies</dt>
              <dd>{(input.referenceClients ?? []).join(', ') || '—'}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="button" variant="secondary" asChild>
              <Link href="/onboarding/profile">Edit in setup</Link>
            </Button>
            <Button
              type="button"
              onClick={handleFindAccounts}
              pending={pending === 'match'}
              disabled={!enriched}
            >
              {pending === 'match' ? 'Searching Ocean…' : 'Refresh lookalikes'}
            </Button>
          </div>
        </section>

        {accounts.length > 0 ? (
          <MatchStep
            accounts={accounts}
            verdicts={verdicts}
            onVerdict={handleVerdict}
            onBack={() => {}}
            onContinue={() => {}}
          />
        ) : (
          <p className="text-paragraph-sm text-text-sub-600">
            {enriched
              ? 'No Ocean lookalikes loaded yet. Refresh to review real companies.'
              : 'Complete your profile so Shortlist can search Ocean for lookalikes.'}
          </p>
        )}
      </main>
    </div>
  )
}
