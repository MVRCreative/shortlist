import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  accountsToCsv,
  enrichmentBatchError,
  enrichmentFromRow,
  humanMiss,
  isQualifiedBuyerTitle,
  linkedinProfileUrl,
  parseDeeplinePayload,
  peopleToEmailCsv,
  rolesFromTitles,
} from './enrich-accounts'

describe('Deepline account enrichment', () => {
  it('refuses to enrich more than the final 10 accounts', () => {
    assert.equal(enrichmentBatchError(10), null)
    assert.match(enrichmentBatchError(11) ?? '', /final 10/)
  })

  it('turns buyer titles into play role filters', () => {
    assert.equal(rolesFromTitles(['CMO / Head of Marketing', 'Founder / CEO']), 'CMO; Head of Marketing; Founder; CEO')
  })

  it('treats bare Founder titles as qualified buyers', () => {
    assert.equal(isQualifiedBuyerTitle('Founder', ['Founder / CEO']), true)
    assert.equal(isQualifiedBuyerTitle('Co-Founder', []), true)
    assert.equal(isQualifiedBuyerTitle('Account Executive', ['Founder / CEO']), false)
    assert.equal(isQualifiedBuyerTitle('Head of Marketing', ['CMO / Head of Marketing']), true)
  })

  it('rescues a rejected Founder with LinkedIn instead of leaking role_mismatch', () => {
    const rescued = enrichmentFromRow(
      {
        company_name: 'Big Orange Lab',
        domain: 'bigorangelab.com',
        contact_found: false,
        miss_reason: 'role_mismatch',
        contacts: null,
        rejected_candidates: [
          {
            company_domain: null,
            company_match_status: 'name_matched',
            company_name: 'Big Orange Lab',
            full_name: 'Timothy Neighbors',
            linkedin_url: 'https://www.linkedin.com/in/timneighbors',
            miss_reason: 'role_mismatch',
            role_match_status: 'provider_candidate',
            title: 'Founder',
          },
        ],
      },
      ['Founder', 'Studio owner', 'Managing director'],
    )
    assert.equal(rescued?.contactName, 'Timothy Neighbors')
    assert.equal(rescued?.title, 'Founder')
    assert.equal(rescued?.linkedinUrl, 'https://www.linkedin.com/in/timneighbors')
    assert.equal(rescued?.missReason, null)
    assert.equal(rescued?.email, null)
  })

  it('keeps a blank row blank and never prints raw miss codes', () => {
    const blank = enrichmentFromRow(
      {
        domain: 'hedrick.io',
        contact_found: false,
        miss_reason: 'no_provider_candidates',
        contacts: null,
        rejected_candidates: [],
      },
      ['Founder'],
    )
    assert.equal(blank?.contactName, null)
    assert.equal(blank?.missCode, 'no_provider_candidates')
    assert.equal(blank?.missReason, 'No decision-maker found')
    assert.doesNotMatch(blank?.missReason ?? '', /no_provider_candidates/)
    assert.equal(humanMiss('role_mismatch'), 'No decision-maker found')
  })

  it('keeps a verified email on a matched first contact', () => {
    const verified = enrichmentFromRow({
      domain: 'acme.com',
      contact_found: true,
      first_contact_first_name: 'Ada',
      first_contact_last_name: 'Lovelace',
      first_contact_title: 'Head of Marketing',
      first_contact_linkedin_url: 'https://www.linkedin.com/in/ada',
      contacts: [{ email: 'ada@acme.com', email_status: 'verified' }],
    })
    assert.equal(verified?.contactName, 'Ada Lovelace')
    assert.equal(verified?.linkedinUrl, 'https://www.linkedin.com/in/ada')
  })

  it('reads batch rows and ignores a search URL', () => {
    const rows = parseDeeplinePayload({
      rows: [
        {
          domain: 'acme.com',
          contact_found: false,
          miss_reason: 'no_contacts',
        },
      ],
    })
    assert.equal(rows.length, 1)
    assert.equal(rows[0]?.contactName, null)
    assert.equal(rows[0]?.missReason, 'No decision-maker found')
    assert.equal(linkedinProfileUrl('https://www.linkedin.com/company/acme'), null)
  })

  it('writes company and people CSVs for the enrichment plays', () => {
    const companies = accountsToCsv(
      [
        {
          name: 'Acme, Inc.',
          domain: 'acme.com',
          linkedinCompanyUrl: 'https://www.linkedin.com/company/acme',
        },
        { name: 'Beta', domain: 'beta.com' },
      ],
      ['Founder'],
    )
    assert.equal(companies.split('\n').filter(Boolean).length, 3)
    assert.match(companies, /linkedin_company_url/)
    assert.match(companies, /"Acme, Inc.",acme.com,https:\/\/www\.linkedin\.com\/company\/acme,Founder/)

    const people = peopleToEmailCsv([
      {
        domain: 'bigorangelab.com',
        companyName: 'Big Orange Lab',
        firstName: 'Timothy',
        lastName: 'Neighbors',
        linkedinUrl: 'https://www.linkedin.com/in/timneighbors',
      },
    ])
    assert.match(people, /Timothy,Neighbors,bigorangelab.com/)
  })
})
