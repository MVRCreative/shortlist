'use client'

import { Button } from '@/components/ui/button'
import { Price } from '@/components/shortlist/price'
import { getTier, planDetail } from '@/lib/shortlist/pricing'
import type { DigestSettings } from '@/lib/shortlist/schemas'

const BILLING_NOTE = 'Billed monthly · cancel anytime'

function StartButton({ pending, onActivate, className }: { pending: boolean; onActivate: () => void; className?: string }) {
  return (
    <Button size="lg" onClick={onActivate} pending={pending} className={className}>
      {pending ? 'Building first digest' : 'Start Shortlist'}
    </Button>
  )
}

export function PlanSummaryPanel({
  settings,
  pending,
  onActivate,
}: {
  settings: DigestSettings
  pending: boolean
  onActivate: () => void
}) {
  const tier = getTier(settings.tier)

  return (
    <section aria-label="Plan summary" className="flex flex-col gap-4 rounded-20 border bg-bg-white-0 p-5 shadow-regular-xs">
      <div className="flex items-start justify-between gap-3" aria-live="polite">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-label-sm">{tier.name}</p>
          <p className="text-paragraph-xs text-pretty">{planDetail(settings)}</p>
        </div>
        <Price amount={tier.price} className="shrink-0" />
      </div>
      <div className="flex flex-col gap-2">
        <StartButton pending={pending} onActivate={onActivate} className="w-full" />
        <p className="text-center text-paragraph-xs">{BILLING_NOTE}</p>
      </div>
    </section>
  )
}

export function PlanSummaryBar({
  settings,
  pending,
  onActivate,
}: {
  settings: DigestSettings
  pending: boolean
  onActivate: () => void
}) {
  const tier = getTier(settings.tier)

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-bg-weak-50/90 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-4 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="flex min-w-0 flex-col gap-0.5" aria-live="polite">
          <p className="flex items-baseline gap-2">
            <span className="text-label-sm">{tier.name}</span>
            <Price amount={tier.price} />
          </p>
          <p className="truncate text-paragraph-xs">{planDetail(settings)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1">
          <StartButton pending={pending} onActivate={onActivate} />
          <p className="text-label-xs text-text-sub-600">{BILLING_NOTE}</p>
        </div>
      </div>
    </div>
  )
}
