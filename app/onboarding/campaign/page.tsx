'use client'

import { CampaignStep } from '@/components/shortlist/campaign-step'
import { useShortlist } from '@/components/shortlist/shortlist-provider'

export default function CampaignPage() {
  const { hydrated, pending, goTo, handleGenerateDigest, setCampaignDraft } = useShortlist()

  if (!hydrated) return null

  return (
    <CampaignStep
      pending={pending === 'digest'}
      onBack={() => goTo('Audience')}
      onSkip={() => {
        setCampaignDraft(null)
        handleGenerateDigest(0)
      }}
      onContinue={(values) => {
        setCampaignDraft(values)
        handleGenerateDigest(0)
      }}
    />
  )
}
