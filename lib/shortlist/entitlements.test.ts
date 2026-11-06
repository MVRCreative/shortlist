import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { deeplineBatchSize } from '@/lib/shortlist/entitlements'
import { buildCompanySearch } from '@/lib/shortlist/ocean-match'
import type { ProfileInput } from '@/lib/shortlist/schemas'
import {
  applyCampaignDraft,
  buildCampaignContent,
  campaignSourceKey,
} from '@/lib/shortlist/campaign-content'

const profile: ProfileInput = {
  website: 'https://fieldworkstudio.com',
  companyName: 'Fieldwork Studio',
  services: ['Motion'],
  caseStudies: [],
  seedClients: ['linear.app', 'vercel.com', 'raycast.com'],
  referenceClients: ['notion.so', 'figma.com'],
  industries: ['B2B SaaS'],
  companySizes: ['51–200'],
  regions: ['North America'],
  buyerTitles: ['Founder / CEO'],
  signals: [],
  excludedDomains: [],
}

describe('deepline batch cap', () => {
  it('never exceeds 10 and respects plan size', () => {
    assert.equal(deeplineBatchSize(5), 5)
    assert.equal(deeplineBatchSize(10), 10)
    assert.equal(deeplineBatchSize(25), 10)
    assert.equal(deeplineBatchSize(0), 1)
  })
})

describe('ocean seeds vs references', () => {
  it('sends at most three lookalike seeds and never includes reference clients', () => {
    const built = buildCompanySearch(profile, { size: 5 })
    assert.ok(!('error' in built))
    if ('error' in built) return
    const filters = built.body.companiesFilters
    assert.deepEqual(filters.lookalikeDomains, ['linear.app', 'vercel.com', 'raycast.com'])
    assert.equal((filters.lookalikeDomains as string[]).length, 3)
    assert.ok(!(filters.lookalikeDomains as string[]).includes('notion.so'))
    assert.ok(!(filters.lookalikeDomains as string[]).includes('figma.com'))
    assert.equal(built.body.size, 5)
  })
})

describe('campaign content reuse', () => {
  it('keeps the same source key until campaign or profile inputs change', () => {
    const enriched = {
      oneLiner: 'Motion for B2B teams',
      category: 'Motion studio',
      valueProp: 'Clear product stories',
      painsSolved: ['Unclear launches'],
      differentiators: ['Editorial craft'],
      icp: {
        industries: ['B2B SaaS'],
        companySize: '51-200',
        regions: ['North America'],
        buyerTitles: ['Founder'],
      },
      buyingSignals: ['Funding'],
      voice: 'Direct',
    }
    const first = buildCampaignContent({ profile, enriched, campaign: null })
    const second = buildCampaignContent({ profile, enriched, campaign: null })
    assert.equal(first.sourceKey, second.sourceKey)
    assert.equal(
      campaignSourceKey(profile, enriched, null),
      campaignSourceKey(profile, enriched, null),
    )

    const webinar = buildCampaignContent({
      profile,
      enriched,
      campaign: {
        name: 'AI Webinar',
        objective: 'Invite owners to a free webinar about AI',
        resourceUrl: 'https://example.com/webinar',
      },
    })
    assert.notEqual(webinar.sourceKey, first.sourceKey)
    assert.match(webinar.linkedinPost.body, /example\.com\/webinar/)
    assert.doesNotMatch(webinar.linkedinPost.body, /linear\.app/)
  })

  it('preserves member edits when the source key still matches', () => {
    const content = buildCampaignContent({ profile, enriched: null })
    const edited = applyCampaignDraft(content, {
      sourceKey: content.sourceKey,
      published: ['linkedinPost'],
      linkedinHook: 'Edited hook',
      linkedinBody: 'Edited body',
    })
    assert.equal(edited.linkedinPost.hook, 'Edited hook')
    assert.equal(edited.linkedinPost.body, 'Edited body')
  })
})
