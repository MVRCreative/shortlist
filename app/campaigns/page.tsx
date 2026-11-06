'use client'

import { useState } from 'react'
import { PageSkeleton } from '@/components/shortlist/page-skeleton'
import { AppShell } from '@/components/shortlist/app-shell'
import { CampaignForm } from '@/components/shortlist/campaign-form'
import { ListBadge, ListEmpty, ListHeader, ListRow, ListRows } from '@/components/shortlist/list-page'
import { useShortlist } from '@/components/shortlist/shortlist-provider'
import { Button } from '@/components/ui/button'
import { studioName } from '@/lib/shortlist/url'

export default function CampaignsPage() {
  const { hydrated, input, isDemo, handleSignOut, campaigns, addCampaign, removeCampaign, campaignDraft, setCampaignDraft } =
    useShortlist()
  const [creating, setCreating] = useState(false)

  if (!hydrated) return <PageSkeleton />

  const isActive = (title: string, objective: string) =>
    campaignDraft?.title === title && campaignDraft?.objective === objective

  return (
    <AppShell
      isDemo={isDemo}
      companyName={studioName(input)}
      website={input.website}
      onSignOut={handleSignOut}
      mainClassName="max-w-3xl gap-6 px-4 pt-8 sm:px-6 lg:px-8"
    >
      <ListHeader
        title="Campaigns"
        actionLabel={creating || campaigns.length === 0 ? undefined : 'New campaign'}
        onAction={() => setCreating(true)}
      />

      {creating ? (
        <CampaignForm
          onCancel={() => setCreating(false)}
          onSave={(values) => {
            addCampaign(values)
            setCreating(false)
          }}
        />
      ) : null}

      {campaigns.length > 0 ? (
        <ListRows>
          {campaigns.map((campaign) => {
            const active = isActive(campaign.title, campaign.objective)
            return (
              <ListRow
                key={campaign.id}
                title={campaign.title}
                meta={campaign.objective}
                badge={active ? <ListBadge>Active</ListBadge> : null}
                actions={
                  active ? null : (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setCampaignDraft(campaign)}>
                      Make active
                    </Button>
                  )
                }
                onRemove={() => {
                  if (active) setCampaignDraft(null)
                  removeCampaign(campaign.id)
                }}
              />
            )
          })}
        </ListRows>
      ) : !creating ? (
        <ListEmpty title="No campaigns yet" actionLabel="Create campaign" onAction={() => setCreating(true)} />
      ) : null}
    </AppShell>
  )
}
