import type { DigestSettings } from '@/lib/gtm/schemas'

// Placeholder economics — tune these once real unit costs are known.
export const PRICING = {
  platformFee: 49,
  perLead: 5,
  perContentPiece: 3,
} as const

const DIGESTS_PER_MONTH: Record<DigestSettings['cadence'], number> = {
  weekly: 4,
  monthly: 1,
}

export type PriceLine = { label: string; detail: string; amount: number }

export function quoteMonthlyPrice(settings: Pick<DigestSettings, 'cadence' | 'leadsPerDigest' | 'channels'>) {
  const digests = DIGESTS_PER_MONTH[settings.cadence]
  const leads = settings.leadsPerDigest * digests
  const pieces = settings.channels.length * digests

  const lines: PriceLine[] = [
    { label: 'Platform', detail: 'Profile, matching, delivery', amount: PRICING.platformFee },
    { label: 'Leads', detail: `${leads} / mo × $${PRICING.perLead}`, amount: leads * PRICING.perLead },
    {
      label: 'Content',
      detail: pieces ? `${pieces} pieces / mo × $${PRICING.perContentPiece}` : 'None selected',
      amount: pieces * PRICING.perContentPiece,
    },
  ]

  return { lines, total: lines.reduce((sum, line) => sum + line.amount, 0), leads, pieces }
}

export const formatUsd = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
