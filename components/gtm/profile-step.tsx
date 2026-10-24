'use client'

import { useState, type FormEvent } from 'react'
import { Sparkles, WandSparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { StepHeading } from '@/components/gtm/step-heading'
import { profileInputSchema, type ProfileInput } from '@/lib/gtm/schemas'
import { sampleProfile } from '@/lib/gtm/sample-profile'

type FieldErrors = Partial<Record<keyof ProfileInput, string>>

export function ProfileStep({
  initial,
  pending,
  onSubmit,
  onDraftChange,
}: {
  initial: ProfileInput
  pending: boolean
  onSubmit: (profile: ProfileInput) => void
  onDraftChange: (profile: ProfileInput) => void
}) {
  const [values, setValues] = useState<ProfileInput>(initial)
  const [errors, setErrors] = useState<FieldErrors>({})

  function setDraft(next: ProfileInput) {
    setValues(next)
    onDraftChange(next)
  }

  function update<K extends keyof ProfileInput>(key: K, value: string) {
    setDraft({ ...values, [key]: value })
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = profileInputSchema.safeParse(values)
    if (!result.success) {
      const next: FieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ProfileInput
        next[key] ??= issue.message
      }
      setErrors(next)
      return
    }
    onSubmit(result.data)
  }

  return (
    <div className="flex flex-col gap-6">
      <StepHeading
        eyebrow="Start here"
        title="Tell us what you sell."
        description="A few rough notes is enough. AI fills in the rest and builds your go-to-market profile."
      />

      <Card>
        <CardContent>
          <form id="profile-form" onSubmit={handleSubmit} noValidate>
            <FieldGroup className="gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field data-invalid={!!errors.companyName}>
                  <FieldLabel htmlFor="companyName">Company</FieldLabel>
                  <Input
                    id="companyName"
                    value={values.companyName}
                    onChange={(e) => update('companyName', e.target.value)}
                    placeholder="Acme Inc."
                    aria-invalid={!!errors.companyName}
                    autoComplete="organization"
                  />
                  {errors.companyName ? <FieldError>{errors.companyName}</FieldError> : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="website">Website</FieldLabel>
                  <Input
                    id="website"
                    value={values.website}
                    onChange={(e) => update('website', e.target.value)}
                    placeholder="acme.com"
                    autoComplete="url"
                  />
                </Field>
              </div>

              <Field data-invalid={!!errors.offering}>
                <FieldLabel htmlFor="offering">What do you sell?</FieldLabel>
                <Textarea
                  id="offering"
                  value={values.offering}
                  onChange={(e) => update('offering', e.target.value)}
                  placeholder="The product or service, and the outcome customers get."
                  aria-invalid={!!errors.offering}
                />
                {errors.offering ? <FieldError>{errors.offering}</FieldError> : null}
              </Field>

              <Field data-invalid={!!errors.targetMarket}>
                <FieldLabel htmlFor="targetMarket">Who do you sell to?</FieldLabel>
                <Textarea
                  id="targetMarket"
                  value={values.targetMarket}
                  onChange={(e) => update('targetMarket', e.target.value)}
                  placeholder="Industries, company size, regions, buyer titles."
                  aria-invalid={!!errors.targetMarket}
                />
                {errors.targetMarket ? <FieldError>{errors.targetMarket}</FieldError> : null}
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="pricing">Pricing</FieldLabel>
                  <Input
                    id="pricing"
                    value={values.pricing}
                    onChange={(e) => update('pricing', e.target.value)}
                    placeholder="$2k/mo, or $40k projects"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="goal">Goal</FieldLabel>
                  <Input
                    id="goal"
                    value={values.goal}
                    onChange={(e) => update('goal', e.target.value)}
                    placeholder="8 meetings a month"
                  />
                </Field>
              </div>
              <FieldDescription>Nothing is saved yet — this is a prototype.</FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          tone="muted"
          onClick={() => {
            setDraft(sampleProfile)
            setErrors({})
          }}
          disabled={pending}
        >
          <WandSparkles />
          Fill with a sample
        </Button>
        <Button type="submit" form="profile-form" size="lg" pending={pending}>
          {pending ? null : <Sparkles />}
          {pending ? 'Enriching profile' : 'Enrich my profile'}
        </Button>
      </div>
    </div>
  )
}
