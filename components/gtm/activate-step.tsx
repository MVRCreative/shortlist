'use client'

import { ArrowLeft, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { StepHeading } from '@/components/gtm/step-heading'
import { formatUsd, quoteMonthlyPrice } from '@/lib/gtm/pricing'
import { channelLabels, contentChannels, type ContentChannel, type DigestSettings } from '@/lib/gtm/schemas'

function PriceSummary({ settings }: { settings: DigestSettings }) {
  const { lines, total } = quoteMonthlyPrice(settings)

  return (
    <Card className="gap-0 bg-muted py-0 shadow-none">
      <CardContent className="flex flex-col gap-4 px-5 py-5">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-eyebrow">Your plan</p>
          <p className="text-meta">Billed monthly · cancel anytime</p>
        </div>
        <dl className="flex flex-col gap-2">
          {lines.map((line) => (
            <div key={line.label} className="flex items-baseline justify-between gap-4">
              <dt className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                <span className="text-body">{line.label}</span>
                <span className="text-meta">{line.detail}</span>
              </dt>
              <dd className="text-body tabular">{formatUsd(line.amount)}</dd>
            </div>
          ))}
        </dl>
        <Separator />
        <div className="flex items-baseline justify-between gap-4" aria-live="polite">
          <p className="text-label">Total</p>
          <p className="tabular">
            <span className="text-section-title">{formatUsd(total)}</span>
            <span className="text-meta"> / mo</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

const channelDescriptions: Record<ContentChannel, string> = {
  linkedinPost: 'One post written in your voice',
  linkedinMessage: 'Connection request + follow-up',
  xPost: 'One short post',
  blogIdea: 'Title, angle, and outline',
}

export function ActivateStep({
  settings,
  fitCount,
  pending,
  onChange,
  onBack,
  onActivate,
}: {
  settings: DigestSettings
  fitCount: number
  pending: boolean
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

  const day = settings.cadence === 'weekly' ? 'Every Monday' : 'The first Monday of each month'
  const { total } = quoteMonthlyPrice(settings)

  return (
    <div className="flex flex-col gap-8">
      <StepHeading
        eyebrow="Almost there"
        title="Turn on your pipeline."
        description={`Tuned on ${fitCount} account${fitCount === 1 ? '' : 's'} you marked as a fit. Choose how often and what lands in your inbox.`}
      />

      <Card>
        <CardContent className="flex flex-col gap-6">
          <Field>
            <FieldLabel id="cadence-label">Cadence</FieldLabel>
            <ToggleGroup
              type="single"
              variant="outline"
              value={settings.cadence}
              onValueChange={(value) => {
                if (value) onChange({ ...settings, cadence: value as DigestSettings['cadence'] })
              }}
              aria-labelledby="cadence-label"
              className="w-full"
            >
              <ToggleGroupItem value="weekly" className="flex-1">
                Weekly
              </ToggleGroupItem>
              <ToggleGroupItem value="monthly" className="flex-1">
                Monthly
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel id="leads-label">Leads per digest</FieldLabel>
              <span className="text-label tabular">{settings.leadsPerDigest}</span>
            </div>
            <Slider
              min={5}
              max={25}
              step={5}
              value={[settings.leadsPerDigest]}
              onValueChange={([value]) => onChange({ ...settings, leadsPerDigest: value })}
              aria-labelledby="leads-label"
            />
          </Field>

          <Separator />

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-4 text-label">Content</legend>
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
          </fieldset>

          <Separator />

          <Field>
            <FieldLabel htmlFor="email">Send to</FieldLabel>
            <Input
              id="email"
              type="email"
              value={settings.email}
              onChange={(e) => onChange({ ...settings, email: e.target.value })}
              placeholder="you@company.com"
              autoComplete="email"
            />
            <FieldDescription>
              {day}: {settings.leadsPerDigest} leads + {settings.channels.length} content piece
              {settings.channels.length === 1 ? '' : 's'}.
            </FieldDescription>
          </Field>
        </CardContent>
      </Card>

      <PriceSummary settings={settings} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" tone="muted" onClick={onBack} disabled={pending}>
          <ArrowLeft />
          Back to accounts
        </Button>
        <Button size="lg" onClick={onActivate} pending={pending}>
          {pending ? null : <Power />}
          {pending ? 'Building first digest' : `Turn on · ${formatUsd(total)}/mo`}
        </Button>
      </div>
    </div>
  )
}
