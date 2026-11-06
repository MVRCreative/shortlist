'use client'

import { PageSkeleton } from '@/components/shortlist/page-skeleton'
import Link from 'next/link'
import { DashboardNav } from '@/components/shortlist/dashboard-nav'
import { CampaignStep } from '@/components/shortlist/campaign-step'
import { useShortlist } from '@/components/shortlist/shortlist-provider'
import { Button } from '@/components/ui/button'
import { studioName } from '@/lib/shortlist/url'

export default function CampaignsPage() {
  const {
    hydrated,
    input,
    isDemo,
    campaignDraft,
    setCampaignDraft,
    handleSignOut,
    pending,
  } = useShortlist()

  if (!hydrated) return <PageSkeleton />

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
          <p className="kicker">Campaigns</p>
          <h1 className="page-title">Why you’re reaching out</h1>
          <p className="max-w-xl text-paragraph-sm text-text-sub-600">
            A campaign is a lightweight outreach purpose. It shapes messaging and campaign content. It is
            not a sequence builder.
          </p>
        </div>

        {campaignDraft ? (
          <section className="flex flex-col gap-3 rounded-20 border border-stroke-soft-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-label-sm">{campaignDraft.title}</p>
                <p className="mt-1 text-paragraph-sm text-text-sub-600">{campaignDraft.objective}</p>
                {campaignDraft.supportingUrl ? (
                  <p className="mt-2 text-paragraph-xs text-text-sub-600">{campaignDraft.supportingUrl}</p>
                ) : null}
              </div>
              <span className="rounded-full bg-bg-weak-50 px-2 py-0.5 text-paragraph-xs">Draft</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="secondary" onClick={() => setCampaignDraft(null)}>
                Clear draft
              </Button>
              <Button type="button" variant="secondary" asChild>
                <Link href="/digest">Open digest</Link>
              </Button>
            </div>
          </section>
        ) : (
          <CampaignStep
            pending={pending === 'digest'}
            onBack={() => {}}
            onSkip={() => setCampaignDraft(null)}
            onContinue={(values) => setCampaignDraft(values)}
          />
        )}
      </main>
    </div>
  )
}
