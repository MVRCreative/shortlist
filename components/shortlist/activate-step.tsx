'use client'

import type { ReactNode } from 'react'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { DeliveryEmail } from '@/components/shortlist/delivery-email'
import { DigestPreview } from '@/components/shortlist/digest-preview'
import { PlanSelector } from '@/components/shortlist/plan-selector'
import { PlanSummaryBar } from '@/components/shortlist/plan-summary'
import { StepHeading } from '@/components/shortlist/step-heading'
import { deliveryFor, deliveryLine } from '@/lib/shortlist/pricing'
import type { DigestSettings } from '@/lib/shortlist/schemas'

function MobileProfile({ name, children }: { name: string; children: ReactNode }) {
  return (
    <Collapsible className="lg:hidden">
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 rounded-20 bg-bg-white-0 px-4 py-3 text-left shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 transition duration-200 ease-out fine-hover:bg-bg-weak-50 focus-visible:shadow-button-important-focus">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-label-sm">Your profile</span>
          <span className="truncate text-paragraph-xs">{name}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-text-sub-600 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">{children}</CollapsibleContent>
    </Collapsible>
  )
}

export function ActivateStep({
  settings,
  fitCount,
  pending,
  profileName,
  profile,
  industries,
  onChange,
  onBack,
  onActivate,
}: {
  settings: DigestSettings
  fitCount: number
  pending: boolean
  profileName: string
  profile: ReactNode
  industries: string[]
  onChange: (settings: DigestSettings) => void
  onBack: () => void
  onActivate: () => void
}) {
  return (
    <div className="flex flex-col gap-6 pb-28 lg:pb-0">
      <StepHeading
        eyebrow="Almost there"
        title="Turn on Shortlist"
        description={`Tuned on ${fitCount} account${fitCount === 1 ? '' : 's'} you marked as a fit. Pick a plan and see what lands in your inbox.`}
      />

      <MobileProfile name={profileName}>{profile}</MobileProfile>

      <Card>
        <CardContent className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 id="plan-label" className="text-label-sm">
              Plan
            </h2>
            <PlanSelector
              value={settings.tier}
              labelledBy="plan-label"
              onChange={(tier) => onChange({ ...settings, tier, ...deliveryFor(tier) })}
            />
            <div className="flex flex-col gap-1 pt-1">
              <p className="text-paragraph-sm" aria-live="polite">
                {deliveryLine(settings)}
              </p>
              <DeliveryEmail email={settings.email} onChange={(email) => onChange({ ...settings, email })} />
            </div>
          </section>

          <Separator />

          <DigestPreview settings={settings} industries={industries} />
        </CardContent>
      </Card>

      <div>
        <Button variant="ghost" tone="muted" onClick={onBack} disabled={pending}>
          <ArrowLeft />
          Back to accounts
        </Button>
      </div>

      <PlanSummaryBar settings={settings} pending={pending} onActivate={onActivate} />
    </div>
  )
}
