'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { OptionalTag } from '@/components/shortlist/profile-fields'
import type { CampaignStepValues } from '@/components/shortlist/campaign-step'

export function CampaignForm({
  onSave,
  onCancel,
}: {
  onSave: (values: CampaignStepValues) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [objective, setObjective] = useState('')
  const [supportingUrl, setSupportingUrl] = useState('')
  const ready = title.trim().length > 0 && objective.trim().length > 0

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!ready) return
    onSave({ title: title.trim(), objective: objective.trim(), supportingUrl: supportingUrl.trim() })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6 rounded-20 border border-stroke-soft-200 p-5">
      <h2 className="section-title">New campaign</h2>
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="campaign-title">Title</FieldLabel>
          <Input
            id="campaign-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="AI Webinar — November"
            autoFocus
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="campaign-objective">Objective</FieldLabel>
          <Textarea
            id="campaign-objective"
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            placeholder="Invite small business owners to our free AI webinar."
            rows={3}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="campaign-url" className="flex items-baseline gap-2">
            Link <OptionalTag />
          </FieldLabel>
          <Input
            id="campaign-url"
            type="url"
            value={supportingUrl}
            onChange={(event) => setSupportingUrl(event.target.value)}
            placeholder="https://example.com/webinar"
          />
        </Field>
      </FieldGroup>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!ready}>
          Save campaign
        </Button>
      </div>
    </form>
  )
}
