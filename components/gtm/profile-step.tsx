'use client'

import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowRight, RefreshCw, Sparkles, WandSparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { ChoiceChip } from '@/components/gtm/choice-chip'
import { EnrichedProfileCard, EnrichedProfileSkeleton } from '@/components/gtm/enriched-profile-card'
import { StepHeading } from '@/components/gtm/step-heading'
import { INDUSTRY_OPTIONS, REGION_OPTIONS, SIZE_OPTIONS } from '@/lib/gtm/profile-options'
import { profileInputSchema, type EnrichedProfile, type ProfileInput } from '@/lib/gtm/schemas'
import { sampleProfile } from '@/lib/gtm/sample-profile'
import { tagColorClass } from '@/lib/gtm/tag-colors'

type FieldErrors = Partial<Record<keyof ProfileInput, string>>
type ListKey = 'industries' | 'companySizes' | 'regions'

function toggleItem(list: string[], item: string) {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item]
}

export function ProfileStep({
  initial,
  enriched,
  isStale,
  pendingEnrich,
  pendingMatch,
  onSubmit,
  onDraftChange,
  onFindAccounts,
}: {
  initial: ProfileInput
  enriched: EnrichedProfile | null
  isStale: boolean
  pendingEnrich: boolean
  pendingMatch: boolean
  onSubmit: (profile: ProfileInput) => void
  onDraftChange: (profile: ProfileInput) => void
  onFindAccounts: () => void
}) {
  const [values, setValues] = useState<ProfileInput>(initial)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [customIndustry, setCustomIndustry] = useState('')

  const industryOptions = [...new Set<string>([...INDUSTRY_OPTIONS, ...values.industries])]
  const busy = pendingEnrich || pendingMatch

  function setDraft(next: ProfileInput) {
    setValues(next)
    onDraftChange(next)
  }

  function update<K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) {
    setDraft({ ...values, [key]: value })
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function toggle(key: ListKey, item: string) {
    update(key, toggleItem(values[key], item))
  }

  function addCustomIndustry() {
    const label = customIndustry.trim()
    if (!label) return
    if (!values.industries.some((i) => i.toLowerCase() === label.toLowerCase())) {
      update('industries', [...values.industries, label])
    }
    setCustomIndustry('')
  }

  function handleCustomKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    addCustomIndustry()
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

  const showEnrichAction = !enriched || isStale

  return (
    <div className="flex flex-col gap-6">
      <StepHeading
        eyebrow="Step 1"
        title="Tell us what you sell."
        description="Pick who you sell to and add a few rough notes. AI builds your go-to-market profile right here."
      />

      <Card>
        <CardContent>
          <form id="profile-form" onSubmit={handleSubmit} noValidate>
            <FieldGroup className="gap-6">
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

              <Separator />

              <FieldSet data-invalid={!!errors.industries} className="gap-3">
                <FieldLegend variant="label" className="mb-1">
                  Industries
                </FieldLegend>
                <FieldDescription>Pick every sector you sell into.</FieldDescription>
                <div className="flex flex-wrap gap-2">
                  {industryOptions.map((industry) => (
                    <ChoiceChip
                      key={industry}
                      selected={values.industries.includes(industry)}
                      selectedClassName={tagColorClass(industry)}
                      onToggle={() => toggle('industries', industry)}
                    >
                      {industry}
                    </ChoiceChip>
                  ))}
                  <label className="sr-only" htmlFor="customIndustry">
                    Add another industry
                  </label>
                  <Input
                    id="customIndustry"
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    onKeyDown={handleCustomKeyDown}
                    onBlur={addCustomIndustry}
                    placeholder="+ Add another"
                    className="h-8 w-36 rounded-full px-3 text-sm"
                  />
                </div>
                {errors.industries ? <FieldError>{errors.industries}</FieldError> : null}
              </FieldSet>

              <FieldSet className="gap-3">
                <FieldLegend variant="label">Company size</FieldLegend>
                <div className="flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map((size) => (
                    <ChoiceChip
                      key={size.label}
                      selected={values.companySizes.includes(size.label)}
                      onToggle={() => toggle('companySizes', size.label)}
                    >
                      {size.label}
                    </ChoiceChip>
                  ))}
                </div>
              </FieldSet>

              <FieldSet className="gap-3">
                <FieldLegend variant="label">Regions</FieldLegend>
                <div className="flex flex-wrap gap-2">
                  {REGION_OPTIONS.map((region) => (
                    <ChoiceChip
                      key={region}
                      selected={values.regions.includes(region)}
                      onToggle={() => toggle('regions', region)}
                    >
                      {region}
                    </ChoiceChip>
                  ))}
                </div>
              </FieldSet>

              <Field>
                <FieldLabel htmlFor="targetMarket">Ideal buyer</FieldLabel>
                <Textarea
                  id="targetMarket"
                  value={values.targetMarket}
                  onChange={(e) => update('targetMarket', e.target.value)}
                  placeholder="Titles, stage, anything else. e.g. Head of Marketing at Series A–C companies."
                  className="min-h-16"
                />
              </Field>

              <Separator />

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
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {showEnrichAction ? (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            tone="muted"
            onClick={() => {
              setDraft(sampleProfile)
              setErrors({})
            }}
            disabled={busy}
          >
            <WandSparkles />
            Fill with a sample
          </Button>
          <Button type="submit" form="profile-form" size="lg" pending={pendingEnrich} disabled={pendingMatch}>
            {pendingEnrich ? null : <Sparkles />}
            {pendingEnrich ? 'Building profile' : enriched ? 'Update profile' : 'Build my profile'}
          </Button>
        </div>
      ) : null}

      {enriched || pendingEnrich ? (
        <section
          id="gtm-profile"
          aria-labelledby="gtm-profile-heading"
          aria-live="polite"
          className="flex scroll-mt-6 flex-col gap-4 pt-4"
        >
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="gtm-profile-heading" className="text-label">
              Your GTM profile
            </h2>
            <p className="text-meta">
              {isStale ? 'Inputs changed. Update to refresh.' : 'Drives every lead and post'}
            </p>
          </div>

          {pendingEnrich && !enriched ? (
            <EnrichedProfileSkeleton />
          ) : enriched ? (
            <div className={isStale || pendingEnrich ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              <EnrichedProfileCard profile={enriched} />
            </div>
          ) : null}

          {enriched ? (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="submit"
                form="profile-form"
                variant="ghost"
                tone="muted"
                pending={pendingEnrich}
                disabled={pendingMatch}
              >
                {pendingEnrich ? null : <RefreshCw />}
                Regenerate
              </Button>
              <Button size="lg" onClick={onFindAccounts} pending={pendingMatch} disabled={pendingEnrich}>
                {pendingMatch ? 'Finding accounts' : 'Find accounts'}
                {pendingMatch ? null : <ArrowRight />}
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
