'use client'

import { useRef, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  CircleDollarSign,
  LoaderCircle,
  Palette,
  RefreshCw,
  Sparkles,
  Target,
  WandSparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChoiceChip } from '@/components/gtm/choice-chip'
import { EnrichedProfileCard, EnrichedProfileSkeleton } from '@/components/gtm/enriched-profile-card'
import { FormSection } from '@/components/gtm/form-section'
import { ChipField, OptionalTag, UrlListField } from '@/components/gtm/profile-fields'
import { StepHeading } from '@/components/gtm/step-heading'
import { analyzeWebsite } from '@/lib/gtm/analyze-website'
import {
  BUYER_TITLE_OPTIONS,
  DEAL_SIZE_OPTIONS,
  dealSizeLabel,
  describeSizeRange,
  INDUSTRY_OPTIONS,
  REGION_OPTIONS,
  SERVICE_OPTIONS,
  SIGNAL_OPTIONS,
  SIZE_OPTIONS,
} from '@/lib/gtm/profile-options'
import type { EnrichedProfile, StudioProfile } from '@/lib/gtm/schemas'
import { sampleProfile } from '@/lib/gtm/sample-profile'
import { tagColorClass } from '@/lib/gtm/tag-colors'
import { normalizeDomain, normalizeUrl } from '@/lib/gtm/url'

type SectionKey = 'studio' | 'clients' | 'deal'

/** Form state keeps raw text so half-typed URLs and blank rows survive edits. */
type ProfileDraft = Omit<StudioProfile, 'excludedDomains'> & { excludedText: string }

function padRows(list: string[], min: number) {
  return list.length >= min ? list : [...list, ...Array(min - list.length).fill('')]
}

function fromProfile(profile: StudioProfile): ProfileDraft {
  const { excludedDomains, ...rest } = profile
  return {
    ...rest,
    caseStudies: padRows(profile.caseStudies, 1),
    seedClients: padRows(profile.seedClients, 2),
    excludedText: excludedDomains.join('\n'),
  }
}

function compact(list: (string | null)[]) {
  return [...new Set(list.filter((value): value is string => !!value))]
}

function toProfile(draft: ProfileDraft): StudioProfile {
  const { excludedText, ...rest } = draft
  return {
    ...rest,
    website: normalizeDomain(draft.website) ?? draft.website.trim(),
    companyName: draft.companyName || undefined,
    caseStudies: compact(draft.caseStudies.map(normalizeUrl)).slice(0, 3),
    seedClients: compact(draft.seedClients.map(normalizeDomain)).slice(0, 3),
    excludedDomains: compact(excludedText.split(/[\n,]+/).map(normalizeDomain)),
  }
}

function listMissing(profile: StudioProfile) {
  const missing: string[] = []
  if (!normalizeDomain(profile.website)) missing.push('your website')
  if (profile.services.length === 0) missing.push('what you do')
  if (profile.seedClients.length < 2) {
    const needed = 2 - profile.seedClients.length
    missing.push(needed === 1 ? '1 more client website' : '2 client websites')
  }
  if (profile.industries.length === 0) missing.push('an industry')
  if (profile.companySizes.length === 0) missing.push('a company size')
  if (profile.regions.length === 0) missing.push('a region')
  if (profile.buyerTitles.length === 0) missing.push('who signs off')
  return missing
}

function countLabel(list: string[], plural: string) {
  if (list.length === 0) return null
  return list.length === 1 ? list[0] : `${list.length} ${plural}`
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
  initial: StudioProfile
  enriched: EnrichedProfile | null
  isStale: boolean
  pendingEnrich: boolean
  pendingMatch: boolean
  onSubmit: (profile: StudioProfile) => void
  onDraftChange: (profile: StudioProfile) => void
  onFindAccounts: () => void
}) {
  const [values, setValues] = useState<ProfileDraft>(() => fromProfile(initial))
  const valuesRef = useRef(values)
  const [websiteTouched, setWebsiteTouched] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [prefilledFrom, setPrefilledFrom] = useState<string | null>(() =>
    initial.companyName ? normalizeDomain(initial.website) : null,
  )
  const analyzedDomain = useRef<string | null>(prefilledFrom)

  const [open, setOpen] = useState<Record<SectionKey, boolean>>(() => {
    const collapsed = !!enriched
    return { studio: !collapsed, clients: !collapsed, deal: false }
  })

  const profile = toProfile(values)
  const missing = listMissing(profile)
  const ready = missing.length === 0
  const busy = pendingEnrich || pendingMatch
  const websiteDomain = normalizeDomain(values.website)
  const websiteInvalid = websiteTouched && !!values.website.trim() && !websiteDomain

  const studioComplete = !!websiteDomain && profile.services.length > 0
  const clientsComplete =
    profile.seedClients.length >= 2 &&
    profile.industries.length > 0 &&
    profile.companySizes.length > 0 &&
    profile.regions.length > 0 &&
    profile.buyerTitles.length > 0
  const dealComplete = !!profile.dealSize || profile.excludedDomains.length > 0

  const studioSummary = [
    profile.companyName ?? websiteDomain,
    countLabel(profile.services, 'services'),
  ]
    .filter(Boolean)
    .join(' · ')
  const clientsSummary = [
    profile.seedClients.slice(0, 2).join(', '),
    countLabel(profile.industries, 'industries'),
    describeSizeRange(profile.companySizes),
  ]
    .filter(Boolean)
    .join(' · ')
  const dealSummary = [
    dealSizeLabel(profile.dealSize),
    profile.excludedDomains.length > 0 &&
      `${profile.excludedDomains.length} skipped domain${profile.excludedDomains.length === 1 ? '' : 's'}`,
  ]
    .filter(Boolean)
    .join(' · ')

  function setDraft(next: ProfileDraft) {
    valuesRef.current = next
    setValues(next)
    onDraftChange(toProfile(next))
  }

  function update<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setDraft({ ...valuesRef.current, [key]: value })
  }

  function setSection(key: SectionKey, next: boolean) {
    setOpen((prev) => ({ ...prev, [key]: next }))
  }

  function handleWebsiteChange(value: string) {
    const keepPrefill = !!prefilledFrom && normalizeDomain(value) === prefilledFrom
    setDraft({
      ...valuesRef.current,
      website: value,
      companyName: keepPrefill ? valuesRef.current.companyName : undefined,
    })
    if (!keepPrefill) {
      setPrefilledFrom(null)
      setAnalyzing(false)
      analyzedDomain.current = null
    }
  }

  async function handleWebsiteBlur() {
    setWebsiteTouched(true)
    const domain = normalizeDomain(valuesRef.current.website)
    if (!domain || domain === analyzedDomain.current) return
    analyzedDomain.current = domain
    setAnalyzing(true)
    const result = await analyzeWebsite(domain)
    if (analyzedDomain.current !== domain) return
    setAnalyzing(false)
    if (!result) return

    const current = valuesRef.current
    const hasCaseStudies = current.caseStudies.some((url) => url.trim())
    setDraft({
      ...current,
      companyName: result.companyName,
      services: current.services.length > 0 ? current.services : result.services,
      caseStudies: hasCaseStudies ? current.caseStudies : padRows(result.caseStudies.slice(0, 3), 1),
    })
    setPrefilledFrom(domain)
  }

  function fillSample() {
    analyzedDomain.current = sampleProfile.website
    setAnalyzing(false)
    setPrefilledFrom(sampleProfile.website)
    setWebsiteTouched(false)
    setDraft(fromProfile(sampleProfile))
    setOpen((prev) => ({ ...prev, studio: true, clients: true }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ready || busy) return
    console.log(profile)
    setOpen({ studio: false, clients: false, deal: false })
    onSubmit(profile)
  }

  const showEnrichAction = !enriched || isStale

  return (
    <div className="flex flex-col gap-6">
      <StepHeading
        eyebrow="Step 1"
        title="Tell us about your studio."
        description="Start with your website and the clients you want more of. AI builds your go-to-market profile right here."
      />

      <form id="profile-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <FormSection
          id="section-studio"
          index={1}
          title="Your studio"
          description="We'll fill most of this in from your website."
          summary={studioSummary}
          icon={Palette}
          tone="purple"
          complete={studioComplete}
          open={open.studio}
          onOpenChange={(next) => setSection('studio', next)}
        >
          <FieldGroup className="gap-6">
            <Field data-invalid={websiteInvalid}>
              <FieldLabel htmlFor="website">Website</FieldLabel>
              <Input
                id="website"
                value={values.website}
                onChange={(event) => handleWebsiteChange(event.target.value)}
                onBlur={handleWebsiteBlur}
                placeholder="yourstudio.com"
                inputMode="url"
                autoComplete="url"
                spellCheck={false}
                required
                aria-invalid={websiteInvalid}
                aria-describedby="website-status"
              />
              <div id="website-status" aria-live="polite" className="empty:hidden">
                {websiteInvalid ? (
                  <p className="text-meta text-destructive">Enter your website, like yourstudio.com</p>
                ) : analyzing ? (
                  <p className="flex items-center gap-1.5 text-meta">
                    <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                    Reading your site…
                  </p>
                ) : prefilledFrom && prefilledFrom === websiteDomain ? (
                  <div className="flex flex-col gap-0.5">
                    {values.companyName ? <p className="text-label">{values.companyName}</p> : null}
                    <p className="text-meta">Prefilled from your site. Edit anything that’s off.</p>
                  </div>
                ) : null}
              </div>
            </Field>

            <ChipField
              id="services"
              legend="What you do"
              options={SERVICE_OPTIONS}
              selected={values.services}
              onChange={(next) => update('services', next)}
              addLabel="Add another service"
            />

            <UrlListField
              id="caseStudies"
              legend={
                <>
                  Best work <OptionalTag />
                </>
              }
              description="1–3 case studies we can reference in your messages."
              values={values.caseStudies}
              onChange={(next) => update('caseStudies', next)}
              minRows={1}
              kind="url"
              placeholder={() => 'yourstudio.com/work/project'}
            />
          </FieldGroup>
        </FormSection>

        <FormSection
          id="section-clients"
          index={2}
          title="Who you want more of"
          description="The clients we'll find more of."
          summary={clientsSummary}
          icon={Target}
          tone="orange"
          complete={clientsComplete}
          open={open.clients}
          onOpenChange={(next) => setSection('clients', next)}
        >
          <FieldGroup className="gap-6">
            <UrlListField
              id="seedClients"
              legend="Clients you’d love more of"
              description="Paste 2–3 websites of clients, past or dream, you’d want more of. This is the most important question."
              values={values.seedClients}
              onChange={(next) => update('seedClients', next)}
              minRows={2}
              kind="domain"
              showFavicons
              placeholder={(index) => ['client.com', 'another-client.com', 'dream-client.com'][index] ?? 'client.com'}
            />

            <ChipField
              id="industries"
              legend="Industries"
              description="Pick every sector you sell into."
              options={INDUSTRY_OPTIONS}
              selected={values.industries}
              onChange={(next) => update('industries', next)}
              addLabel="Add another industry"
              selectedClassName={tagColorClass}
            />

            <ChipField
              id="companySizes"
              legend="Their company size"
              description="Employees at the companies you sell to."
              options={SIZE_OPTIONS.map((size) => size.label)}
              selected={values.companySizes}
              onChange={(next) =>
                update(
                  'companySizes',
                  SIZE_OPTIONS.map((size) => size.label).filter((label) => next.includes(label)),
                )
              }
            />

            <ChipField
              id="regions"
              legend="Regions"
              options={REGION_OPTIONS}
              selected={values.regions}
              onChange={(next) => update('regions', next)}
            />

            <ChipField
              id="buyerTitles"
              legend="Who signs off"
              options={BUYER_TITLE_OPTIONS}
              selected={values.buyerTitles}
              onChange={(next) => update('buyerTitles', next)}
              addLabel="Add another title"
            />

            <ChipField
              id="signals"
              legend={
                <>
                  Best time to reach them <OptionalTag />
                </>
              }
              description="We’ll prioritize accounts showing these signals."
              options={SIGNAL_OPTIONS}
              selected={values.signals}
              onChange={(next) => update('signals', next)}
            />
          </FieldGroup>
        </FormSection>

        <FormSection
          id="section-deal"
          index={3}
          title="Deal size"
          description="Optional. Helps us match accounts that can afford you."
          summary={dealSummary}
          icon={CircleDollarSign}
          tone="teal"
          complete={dealComplete}
          open={open.deal}
          onOpenChange={(next) => setSection('deal', next)}
        >
          <FieldGroup className="gap-6">
            <FieldSet className="gap-3">
              <FieldLegend variant="label">Typical project</FieldLegend>
              <div role="radiogroup" aria-label="Typical project" className="flex flex-wrap gap-2">
                {DEAL_SIZE_OPTIONS.map((option) => (
                  <ChoiceChip
                    key={option.value}
                    mode="radio"
                    selected={values.dealSize === option.value}
                    onToggle={() =>
                      update('dealSize', values.dealSize === option.value ? undefined : option.value)
                    }
                  >
                    {option.label}
                  </ChoiceChip>
                ))}
              </div>
            </FieldSet>

            <Field>
              <FieldLabel htmlFor="excludedDomains">Accounts to skip</FieldLabel>
              <Textarea
                id="excludedDomains"
                value={values.excludedText}
                onChange={(event) => update('excludedText', event.target.value)}
                placeholder="Current clients or competitors, one domain per line."
                spellCheck={false}
                className="min-h-20"
              />
              <FieldDescription>We’ll never include these in your drops.</FieldDescription>
            </Field>
          </FieldGroup>
        </FormSection>
      </form>

      {showEnrichAction ? (
        <div className="flex flex-col gap-3">
          {!ready ? (
            <p className="text-meta text-pretty sm:text-right" aria-live="polite">
              Still needed: {missing.join(', ')}.
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" tone="muted" onClick={fillSample} disabled={busy}>
              <WandSparkles />
              Fill with a sample
            </Button>
            <Button
              type="submit"
              form="profile-form"
              size="lg"
              pending={pendingEnrich}
              disabled={pendingMatch || !ready}
            >
              {pendingEnrich ? null : <Sparkles />}
              {pendingEnrich ? 'Building profile' : enriched ? 'Update profile' : 'Build my profile'}
            </Button>
          </div>
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
            <p className="text-meta">{isStale ? 'Inputs changed. Update to refresh.' : 'Drives every lead and post'}</p>
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
                disabled={pendingMatch || !ready}
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
