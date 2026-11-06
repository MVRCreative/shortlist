'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ChipField, OptionalTag } from '@/components/shortlist/profile-fields'
import type { SavedAudience } from '@/lib/shortlist/library'

type AudienceValues = Omit<SavedAudience, 'id' | 'createdAt'>

const LIST_FIELDS = [
  { key: 'industries', label: 'Industries', placeholder: 'e.g. Fintech' },
  { key: 'buyerTitles', label: 'Buyer titles', placeholder: 'e.g. VP Marketing' },
  { key: 'companySizes', label: 'Company size', placeholder: 'e.g. 51–200' },
  { key: 'regions', label: 'Regions', placeholder: 'e.g. North America' },
  { key: 'exampleCompanies', label: 'Example companies', placeholder: 'e.g. ramp.com', optional: true },
] as const

export function AudienceForm({
  onSave,
  onCancel,
}: {
  onSave: (values: AudienceValues) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<AudienceValues>({
    name: '',
    industries: [],
    buyerTitles: [],
    companySizes: [],
    regions: [],
    exampleCompanies: [],
  })
  const ready = values.name.trim().length > 0 && (values.industries.length > 0 || values.buyerTitles.length > 0)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!ready) return
    onSave({ ...values, name: values.name.trim() })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6 rounded-20 border border-stroke-soft-200 p-5">
      <h2 className="section-title">New audience</h2>
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="audience-name">Name</FieldLabel>
          <Input
            id="audience-name"
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
            placeholder="Series A fintech"
            autoFocus
          />
        </Field>
        {LIST_FIELDS.map((field) => (
          <ChipField
            key={field.key}
            id={`audience-${field.key}`}
            legend={
              <>
                {field.label}
                {'optional' in field ? <OptionalTag /> : null}
              </>
            }
            options={[]}
            selected={values[field.key]}
            onChange={(next) => setValues({ ...values, [field.key]: next })}
            addLabel={`Add ${field.label.toLowerCase()}`}
            addPlaceholder={field.placeholder}
          />
        ))}
      </FieldGroup>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!ready}>
          Save audience
        </Button>
      </div>
    </form>
  )
}
