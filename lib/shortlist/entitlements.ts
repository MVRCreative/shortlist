import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type Client = SupabaseClient<Database>

export type EntitlementOk = {
  ok: true
  businessId: string
  planId: string
  accountsPerDrop: number
  cadence: 'weekly' | 'monthly'
  periodStart: Date
  periodEnd: Date
}

export type EntitlementDenied = { ok: false; error: string }

/**
 * Paid Ocean/Deepline runs require a completed onboarding, a live subscription,
 * and no delivered drop already covering the current plan period.
 */
export async function assertCanRunPaidDiscovery(
  client: Client,
  businessId: string,
): Promise<EntitlementOk | EntitlementDenied> {
  const { data: business, error: businessError } = await client
    .from('businesses')
    .select('id, onboarding_completed_at')
    .eq('id', businessId)
    .maybeSingle()
  if (businessError) return { ok: false, error: businessError.message }
  if (!business) return { ok: false, error: 'Business not found.' }
  if (!business.onboarding_completed_at) {
    return {
      ok: false,
      error: 'Finish onboarding before Shortlist can discover accounts.',
    }
  }

  const { data: subscription, error: subError } = await client
    .from('subscriptions')
    .select('id, plan_id, status, current_period_start, current_period_end')
    .eq('business_id', businessId)
    .in('status', ['trialing', 'active'])
    .maybeSingle()
  if (subError) return { ok: false, error: subError.message }
  if (!subscription) {
    return {
      ok: false,
      error: 'Choose a plan before Shortlist can discover accounts.',
    }
  }

  const { data: plan, error: planError } = await client
    .from('plans')
    .select('id, accounts_per_drop, delivery_cadence')
    .eq('id', subscription.plan_id)
    .maybeSingle()
  if (planError) return { ok: false, error: planError.message }
  if (!plan) return { ok: false, error: 'Plan not found.' }

  const now = new Date()
  const periodStart = subscription.current_period_start
    ? new Date(subscription.current_period_start)
    : startOfPeriod(plan.delivery_cadence, now)
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end)
    : endOfPeriod(plan.delivery_cadence, periodStart)

  const { data: existing, error: dropError } = await client
    .from('drops')
    .select('id')
    .eq('business_id', businessId)
    .eq('status', 'delivered')
    .gte('delivered_at', periodStart.toISOString())
    .lt('delivered_at', periodEnd.toISOString())
    .limit(1)
    .maybeSingle()
  if (dropError) return { ok: false, error: dropError.message }
  if (existing) {
    return {
      ok: false,
      error:
        plan.delivery_cadence === 'weekly'
          ? 'This week’s Shortlist is already delivered. The next drop lands on schedule.'
          : 'This month’s Shortlist is already delivered. The next drop lands on schedule.',
    }
  }

  return {
    ok: true,
    businessId,
    planId: plan.id,
    accountsPerDrop: plan.accounts_per_drop,
    cadence: plan.delivery_cadence,
    periodStart,
    periodEnd,
  }
}

function startOfPeriod(cadence: 'weekly' | 'monthly', now: Date) {
  if (cadence === 'monthly') {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  }
  const day = now.getUTCDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() + mondayOffset)
  monday.setUTCHours(0, 0, 0, 0)
  return monday
}

function endOfPeriod(cadence: 'weekly' | 'monthly', start: Date) {
  const end = new Date(start)
  if (cadence === 'monthly') {
    end.setUTCMonth(end.getUTCMonth() + 1)
  } else {
    end.setUTCDate(end.getUTCDate() + 7)
  }
  return end
}

/** Cap any paid Deepline batch at the plan size and the hard 10-account limit. */
export function deeplineBatchSize(accountsPerDrop: number) {
  return Math.min(Math.max(Math.trunc(accountsPerDrop), 1), 10)
}
