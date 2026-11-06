'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { StepHeading } from '@/components/shortlist/step-heading'

export type CampaignStepValues = {
  title: string
  objective: string
  supportingUrl: string
}

export function CampaignStep({
  initial,
  pending,
  onSkip,
  onBack,
  onContinue,
}: {
  initial?: Partial<CampaignStepValues>
  pending: boolean
  onSkip: () => void
  onBack: () => void
  onContinue: (values: CampaignStepValues) => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [objective, setObjective] = useState(initial?.objective ?? '')
  const [supportingUrl, setSupportingUrl] = useState(initial?.supportingUrl ?? '')

  const [action, setAction] = useState<'skip' | 'save' | null>(null)

  const ready = title.trim().length > 0 && objective.trim().length > 0

  return (
    <div className="flex flex-col gap-6 pb-28 lg:pb-0">
      <StepHeading
        eyebrow="Optional"
        title="Start a campaign"
        description="A webinar, launch, or offer to reach out about. You can skip this."
      />

      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="campaign-title">Campaign title</FieldLabel>
          <Input
            id="campaign-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="AI Webinar — November"
            disabled={pending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="campaign-objective">Objective</FieldLabel>
          <Textarea
            id="campaign-objective"
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            placeholder="We’re hosting a free webinar about implementing AI in small businesses and want to invite owners who would benefit."
            rows={4}
            disabled={pending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="campaign-url">Supporting URL</FieldLabel>
          <Input
            id="campaign-url"
            value={supportingUrl}
            onChange={(event) => setSupportingUrl(event.target.value)}
            placeholder="https://example.com/webinar"
            disabled={pending}
          />
        </Field>
      </FieldGroup>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" onClick={onBack} disabled={pending}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setAction('skip')
            onSkip()
          }}
          disabled={pending && action !== 'skip'}
          pending={pending && action === 'skip'}
        >
          {pending && action === 'skip' ? 'Building your Shortlist…' : 'Skip for now'}
        </Button>
        <Button
          type="button"
          disabled={!ready || (pending && action !== 'save')}
          pending={pending && action === 'save'}
          onClick={() => {
            setAction('save')
            onContinue({
              title: title.trim(),
              objective: objective.trim(),
              supportingUrl: supportingUrl.trim(),
            })
          }}
        >
          {pending && action === 'save' ? 'Saving…' : 'Save campaign'}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
