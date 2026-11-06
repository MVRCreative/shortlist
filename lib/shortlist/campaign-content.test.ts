import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { applyCampaignDraft, buildCampaignContent } from '@/lib/shortlist/campaign-content'
import type { EnrichedProfile } from '@/lib/shortlist/schemas'

const profile = {
  website: 'fieldworkstudio.com',
  companyName: 'Fieldwork Studio',
  services: ['Motion'],
  industries: ['B2B SaaS'],
  buyerTitles: ['Founder / CEO'],
  regions: ['North America'],
  caseStudies: [] as string[],
}

const enriched: EnrichedProfile = {
  oneLiner: 'Fieldwork Studio makes product films for software companies.',
  category: 'Motion studio',
  valueProp: 'Product films that explain a launch without a sales deck.',
  painsSolved: ['Launch films that do not explain the product'],
  differentiators: ['Directors who have shipped software'],
  icp: {
    industries: ['B2B SaaS'],
    companySize: '51–200 employees',
    regions: ['North America'],
    buyerTitles: ['Founder / CEO'],
  },
  buyingSignals: ['Product launch'],
  voice: 'Plain and specific.',
}

function blob(content: ReturnType<typeof buildCampaignContent>) {
  return JSON.stringify(content)
}

describe('campaign content', () => {
  it('stays on the business and does not announce a weekly account drop', () => {
    const content = buildCampaignContent({ profile, enriched })
    const text = blob(content)
    assert.match(content.linkedinPost.hook, /Launch films/)
    assert.match(content.linkedinPost.body, /Motion/)
    assert.match(content.linkedinPost.body, /Fieldwork Studio/)
    assert.doesNotMatch(text, /Shortlist/i)
    assert.doesNotMatch(text, /found \d+ accounts/i)
    assert.doesNotMatch(text, /this week/i)
    assert.doesNotMatch(text, /https?:\/\//)
    assert.ok(content.xPost.body.length <= 270)
    assert.equal(content.blogIdea.outline.length, 4)
    assert.equal(content.campaignName, null)
  })

  it('reuses the same copy when the weekly account list is not part of the source', () => {
    const first = buildCampaignContent({ profile, enriched })
    const second = buildCampaignContent({ profile, enriched })
    assert.equal(first.sourceKey, second.sourceKey)
    assert.equal(first.linkedinPost.body, second.linkedinPost.body)
    assert.notEqual(
      first.sourceKey,
      buildCampaignContent({ profile: { ...profile, services: ['Brand'] }, enriched }).sourceKey,
    )
  })

  it('uses a campaign objective and resource only when they were supplied', () => {
    const content = buildCampaignContent({
      profile,
      enriched,
      campaign: {
        name: 'Operator webinar',
        objective: 'Invite operations leaders to a working session on handoffs.',
        resourceUrl: 'https://fieldworkstudio.com/webinar',
        resourceLabel: 'Register',
      },
    })
    assert.equal(content.campaignName, 'Operator webinar')
    assert.match(content.linkedinPost.hook, /handoffs/)
    assert.match(content.linkedinPost.body, /Register: https:\/\/fieldworkstudio.com\/webinar/)
    assert.match(content.xPost.body, /fieldworkstudio.com\/webinar/)
    assert.doesNotMatch(blob(content), /10 accounts/)
    assert.ok(content.xPost.body.length <= 270)
  })

  it('keeps an edited field and leaves the others on the generated copy', () => {
    const content = buildCampaignContent({ profile, enriched })
    const edited = applyCampaignDraft(content, {
      sourceKey: content.sourceKey,
      published: ['linkedinPost'],
      linkedinHook: 'A tighter hook.',
    })
    assert.equal(edited.linkedinPost.hook, 'A tighter hook.')
    assert.equal(edited.linkedinPost.body, content.linkedinPost.body)
    assert.equal(edited.xPost.body, content.xPost.body)

    const cleared = applyCampaignDraft(content, {
      sourceKey: content.sourceKey,
      published: [],
      blogOutline: '',
    })
    assert.deepEqual(cleared.blogIdea.outline, [])
  })
})
