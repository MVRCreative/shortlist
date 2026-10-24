import type { DigestSettings, TierId } from '@/lib/gtm/schemas'

export type Tier = {
  id: TierId
  name: string
  accountsPerMonth: number
  price: number
  label: string
  recommended?: boolean
}

export const TIERS: Tier[] = [
  { id: 'starter', name: 'Starter', accountsPerMonth: 10, price: 79, label: '10 accounts a month' },
  { id: 'pro', name: 'Pro', accountsPerMonth: 20, price: 99, label: '5 accounts a week', recommended: true },
  { id: 'growth', name: 'Growth', accountsPerMonth: 40, price: 179, label: '10 accounts a week' },
]

export const DEFAULT_TIER: TierId = 'pro'

export function getTier(id: TierId) {
  return TIERS.find((tier) => tier.id === id) ?? TIERS[1]
}

/** Starter lands once a month; Pro and Growth land every Monday. */
export function deliveryFor(id: TierId): Pick<DigestSettings, 'cadence' | 'leadsPerDigest'> {
  const tier = getTier(id)
  const cadence = id === 'starter' ? 'monthly' : 'weekly'
  return { cadence, leadsPerDigest: cadence === 'weekly' ? tier.accountsPerMonth / 4 : tier.accountsPerMonth }
}

export function deliveryLine(settings: DigestSettings) {
  const when = settings.cadence === 'weekly' ? 'Every Monday' : 'On the 1st of each month'
  const pieces = settings.channels.length
  const content = pieces > 0 ? ` + ${pieces} content piece${pieces === 1 ? '' : 's'}` : ''
  return `${when}: ${settings.leadsPerDigest} accounts${content}.`
}

export function planDetail(settings: DigestSettings) {
  const types = settings.channels.length
  return `${getTier(settings.tier).label} · ${types} content type${types === 1 ? '' : 's'}`
}

export const formatUsd = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
