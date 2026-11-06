'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  applyCampaignDraft,
  readCampaignDraft,
  resolveCampaignContent,
  writeCampaignDraft,
  type CampaignAssetId,
  type CampaignBrief,
  type CampaignContent,
  type CampaignCopyDraft,
  type CampaignCopyPatch,
  type CampaignProfile,
} from '@/lib/shortlist/campaign-content'
import type { Digest, EnrichedProfile } from '@/lib/shortlist/schemas'

export function useCampaignContent(args: {
  profile: CampaignProfile
  enriched: EnrichedProfile | null
  campaign?: CampaignBrief | null
  digest: Digest | null
}) {
  const generated = useMemo(
    () =>
      resolveCampaignContent({
        profile: args.profile,
        enriched: args.enriched,
        campaign: args.campaign ?? null,
        digest: args.digest,
      }),
    [args.profile, args.enriched, args.campaign, args.digest],
  )

  const [draft, setDraft] = useState<CampaignCopyDraft | null>(null)

  useEffect(() => {
    setDraft(readCampaignDraft(generated.sourceKey))
  }, [generated.sourceKey])

  const content: CampaignContent = useMemo(
    () => applyCampaignDraft(generated, draft),
    [generated, draft],
  )

  const update = useCallback(
    (patch: CampaignCopyPatch) => {
      setDraft((current) => {
        const base: CampaignCopyDraft =
          current?.sourceKey === generated.sourceKey
            ? current
            : { sourceKey: generated.sourceKey, published: [] }
        const next: CampaignCopyDraft = { ...base, ...patch, sourceKey: generated.sourceKey }
        writeCampaignDraft(next)
        return next
      })
    },
    [generated.sourceKey],
  )

  const published = useMemo(
    () => new Set<CampaignAssetId>(draft?.sourceKey === generated.sourceKey ? draft.published : []),
    [draft, generated.sourceKey],
  )

  const togglePublished = useCallback(
    (id: CampaignAssetId) => {
      setDraft((current) => {
        const base: CampaignCopyDraft =
          current?.sourceKey === generated.sourceKey
            ? current
            : { sourceKey: generated.sourceKey, published: [] }
        const nextPublished = base.published.includes(id)
          ? base.published.filter((item) => item !== id)
          : [...base.published, id]
        const next: CampaignCopyDraft = { ...base, published: nextPublished, sourceKey: generated.sourceKey }
        writeCampaignDraft(next)
        return next
      })
    },
    [generated.sourceKey],
  )

  return { content, draft, published, update, togglePublished }
}
