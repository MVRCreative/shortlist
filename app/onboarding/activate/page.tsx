'use client'

import { ActivateStep } from '@/components/shortlist/activate-step'
import { ProfileCard } from '@/components/shortlist/profile-preview'
import { useShortlist } from '@/components/shortlist/shortlist-provider'
import { studioName } from '@/lib/shortlist/url'

export default function ActivatePage() {
  const {
    hydrated,
    settings,
    setSettings,
    fitCount,
    missCount,
    pending,
    input,
    enriched,
    goTo,
    handleGenerateDigest,
  } = useShortlist()

  if (!hydrated) return null

  return (
    <ActivateStep
      settings={settings}
      fitCount={fitCount}
      pending={pending === 'digest'}
      profileName={studioName(input)}
      profile={<ProfileCard input={input} enriched={enriched} fitCount={fitCount} missCount={missCount} />}
      industries={enriched?.icp.industries ?? input.industries ?? []}
      onChange={setSettings}
      onBack={() => goTo('Match')}
      onActivate={() => handleGenerateDigest(0)}
    />
  )
}
