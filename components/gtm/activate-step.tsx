'use client'

import type { ReactNode } from 'react'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { DeliveryEmail } from '@/components/gtm/delivery-email'
import { DigestPreview } from '@/components/gtm/digest-preview'
import { PlanSelector } from '@/components/gtm/plan-selector'
import { PlanSummaryBar } from '@/components/gtm/plan-summary'
import { StepHeading } from '@/components/gtm/step-heading'
import { deliveryFor, deliveryLine } from '@/lib/gtm/pricing'
import type { DigestSettings } from '@/lib/gtm/schemas'

function MobileProfile({ name, children }: { name: string; children: ReactNode }) {
  return (
    <Collapsible className="lg:hidden">
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-label">Your profile</span>
          <span className="truncate text-meta">{name}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-icon-sm shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-data-[state=open]:rotate-180"
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
            <h2 id="plan-label" className="text-label">
              Plan
            </h2>
            <PlanSelector
              value={settings.tier}
              labelledBy="plan-label"
              onChange={(tier) => onChange({ ...settings, tier, ...deliveryFor(tier) })}
            />
            <div className="flex flex-col gap-1 pt-1">
              <p className="text-body" aria-live="polite">
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
