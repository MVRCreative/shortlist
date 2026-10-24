'use client'

import type { ReactNode } from 'react'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { DeliveryEmail } from '@/components/gtm/delivery-email'
import { PlanSelector } from '@/components/gtm/plan-selector'
import { PlanSummaryBar } from '@/components/gtm/plan-summary'
import { StepHeading } from '@/components/gtm/step-heading'
import { deliveryFor, deliveryLine } from '@/lib/gtm/pricing'
import { channelLabels, contentChannels, type ContentChannel, type DigestSettings } from '@/lib/gtm/schemas'

const channelDescriptions: Record<ContentChannel, string> = {
  linkedinPost: 'One post written for your studio',
  linkedinMessage: 'A personalized note for every account',
  xPost: 'One short post',
  blogIdea: 'Title, angle, and outline',
}

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
  onChange,
  onBack,
  onActivate,
}: {
  settings: DigestSettings
  fitCount: number
  pending: boolean
  profileName: string
  profile: ReactNode
  onChange: (settings: DigestSettings) => void
  onBack: () => void
  onActivate: () => void
}) {
  const toggleChannel = (channel: ContentChannel, on: boolean) =>
    onChange({
      ...settings,
      channels: on
        ? contentChannels.filter((c) => c === channel || settings.channels.includes(c))
        : settings.channels.filter((c) => c !== channel),
    })

  return (
    <div className="flex flex-col gap-6 pb-28 lg:pb-0">
      <StepHeading
        eyebrow="Almost there"
        title="Turn on Shortlist"
        description={`Tuned on ${fitCount} account${fitCount === 1 ? '' : 's'} you marked as a fit. Pick a plan and what lands in your inbox.`}
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

          <fieldset aria-describedby="content-help">
            <legend className="mb-0.5 text-label">Content</legend>
            <p id="content-help" className="text-meta">
              Included in every plan.
            </p>
            <div className="mt-4 flex flex-col gap-4">
            {contentChannels.map((channel) => (
              <div key={channel} className="flex items-center justify-between gap-4">
                <label htmlFor={`channel-${channel}`} className="flex flex-col gap-0.5">
                  <span className="text-body">{channelLabels[channel]}</span>
                  <span className="text-meta">{channelDescriptions[channel]}</span>
                </label>
                <Switch
                  id={`channel-${channel}`}
                  checked={settings.channels.includes(channel)}
                  onCheckedChange={(on) => toggleChannel(channel, on)}
                />
              </div>
            ))}
            </div>
          </fieldset>
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
