import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { OceanCompany } from '@/lib/ocean/schemas'
import { buildCompanySearch, toSampleAccounts } from '@/lib/shortlist/ocean-match'
import {
  domainsToSkip,
  isDeliverableAccount,
  leadFromAccount,
  signalFromAccount,
} from '@/lib/shortlist/live-digest'
import type { ProfileInput, SampleAccount } from '@/lib/shortlist/schemas'

const profile: ProfileInput = {
  website: 'https://fieldworkstudio.com',
  services: ['Motion'],
  caseStudies: [],
  seedClients: ['linear.app', 'vercel.com'],
  industries: ['B2B SaaS'],
  companySizes: ['51–200'],
  regions: ['North America'],
  buyerTitles: ['Founder / CEO'],
  signals: [],
  excludedDomains: ['relay.so'],
  referenceClients: [],
}

function company(domain: string, name: string, extras: Partial<OceanCompany> = {}): OceanCompany {
  return {
    domain,
    name,
    companySize: '51-200',
    primaryCountry: 'us',
    industries: ['Software'],
    description: `${name} builds software.`,
    ...extras,
  }
}

describe('weekly account selection', () => {
  it('skips the studio, seeds, exclusions, reviewed accounts, and prior drops', () => {
    const skipped = domainsToSkip({
      website: profile.website,
      seedClients: profile.seedClients,
      excludedDomains: profile.excludedDomains,
      reviewedDomains: ['https://www.notion.so/about', 'notion.so'],
      priorDomains: ['stripe.com'],
    })
    assert.deepEqual(skipped, ['fieldworkstudio.com', 'linear.app', 'vercel.com', 'relay.so', 'notion.so', 'stripe.com'])
  })

  it('asks Ocean to exclude accounts the user has already seen', () => {
    const built = buildCompanySearch(profile, {
      size: 10,
      extraExcludeDomains: ['notion.so', 'stripe.com'],
    })
    assert.ok(!('error' in built))
    if ('error' in built) return
    const excluded = built.body.companiesFilters.excludeDomains as string[]
    assert.ok(excluded.includes('notion.so'))
    assert.ok(excluded.includes('stripe.com'))
    assert.ok(excluded.includes('linear.app'))
    assert.equal(built.body.size, 10)
  })

  it('keeps Ocean LinkedIn company URLs for Deepline', () => {
    const accounts = toSampleAccounts(
      [
        company('notion.so', 'Notion', {
          medias: { linkedin: { url: 'https://www.linkedin.com/company/notion-hq' } },
        }),
      ],
      new Set(),
      1,
    )
    assert.equal(accounts[0]?.linkedinCompanyUrl, 'https://www.linkedin.com/company/notion-hq')
  })

  it('does not return blocked domains and stops at the requested count', () => {
    const accounts = toSampleAccounts(
      [
        company('linear.app', 'Linear'),
        company('notion.so', 'Notion'),
        company('stripe.com', 'Stripe'),
        company('figma.com', 'Figma'),
      ],
      new Set(['linear.app', 'stripe.com']),
      1,
    )
    assert.deepEqual(
      accounts.map((account) => account.domain),
      ['notion.so'],
    )
  })

  it('builds a product-safe signal without provider names or about-blurbs', () => {
    const account: SampleAccount = {
      id: 'ocean:hedrick.io',
      name: 'Hedrick',
      domain: 'hedrick.io',
      industry: 'Web Design',
      employees: '11–50',
      location: 'United States',
      signal: '',
      fitReason: 'We’re a leading Webflow Enterprise agency.',
    }
    const signal = signalFromAccount(account, profile.seedClients)
    assert.match(signal, /Looks like linear\.app, vercel\.com/)
    assert.doesNotMatch(signal, /Webflow Enterprise/)
    assert.doesNotMatch(signal, /Ocean/)
  })

  it('drops incomplete contacts and writes Hey-first messaging for complete ones', () => {
    const account: SampleAccount = {
      id: 'ocean:bigorangelab.com',
      name: 'Big Orange Lab',
      domain: 'bigorangelab.com',
      industry: 'Software',
      employees: '11–50',
      location: 'United States',
      signal: 'Seed — $2,000,000',
      fitReason: 'Big Orange Lab builds software.',
    }

    assert.equal(
      isDeliverableAccount(account, {
        domain: 'bigorangelab.com',
        contactName: null,
        firstName: null,
        lastName: null,
        title: null,
        email: null,
        linkedinUrl: null,
        missReason: 'No decision-maker found',
        missCode: 'no_provider_candidates',
        emailNote: null,
      }),
      false,
    )
    assert.equal(
      leadFromAccount(
        account,
        {
          domain: 'bigorangelab.com',
          contactName: null,
          firstName: null,
          lastName: null,
          title: null,
          email: null,
          linkedinUrl: null,
          missReason: 'No decision-maker found',
          missCode: 'no_provider_candidates',
          emailNote: null,
        },
        profile.seedClients,
      ),
      null,
    )

    const withPerson = leadFromAccount(
      account,
      {
        domain: 'bigorangelab.com',
        contactName: 'Timothy Neighbors',
        firstName: 'Timothy',
        lastName: 'Neighbors',
        title: 'Founder',
        email: null,
        linkedinUrl: 'https://www.linkedin.com/in/timneighbors',
        missReason: null,
        missCode: null,
        emailNote: 'No verified email found',
      },
      profile.seedClients,
    )
    assert.ok(withPerson)
    assert.equal(withPerson?.contactName, 'Timothy Neighbors')
    assert.equal(withPerson?.email, null)
    assert.equal(withPerson?.linkedinUrl, 'https://www.linkedin.com/in/timneighbors')
    assert.equal(withPerson?.signal, 'Seed — $2,000,000')
    assert.match(withPerson?.angle ?? '', /Reference the recent Seed — \$2,000,000/)
    assert.match(withPerson?.fitReason ?? '', /Big Orange Lab/)
    assert.notEqual(withPerson?.angle, withPerson?.signal)
    assert.match(withPerson?.message ?? '', /^Hey Timothy — /)
    assert.doesNotMatch(withPerson?.message ?? '', /no_provider_candidates/)
    assert.doesNotMatch(withPerson?.signal ?? '', /Ocean/)
  })
})
