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
import { ChoiceChip } from '@/components/shortlist/choice-chip'
import { EnrichedProfileCard, EnrichedProfileSkeleton } from '@/components/shortlist/enriched-profile-card'
import { FormSection } from '@/components/shortlist/form-section'
import { ChipField, OptionalTag, UrlListField } from '@/components/shortlist/profile-fields'
import { StepHeading } from '@/components/shortlist/step-heading'
import { readStudioWebsite } from '@/app/actions'
import { DEAL_SIZE_OPTIONS, dealSizeLabel, describeSizeRange } from '@/lib/shortlist/profile-options'
import type { EnrichedProfile, StudioProfile } from '@/lib/shortlist/schemas'
import { sampleProfile } from '@/lib/shortlist/sample-profile'
import { tagColorClass } from '@/lib/shortlist/tag-colors'
import { normalizeDomain, normalizeUrl } from '@/lib/shortlist/url'

type SectionKey = 'studio' | 'clients' | 'deal'

type ChipKey = 'services' | 'industries' | 'companySizes' | 'regions' | 'buyerTitles' | 'signals'
type ChipOptions = Record<ChipKey, string[]>
type WebsiteRead = Extract<Awaited<ReturnType<typeof readStudioWebsite>>, { ok: true }>['data']

const EMPTY_CHIPS: ChipOptions = {
  services: [],
  industries: [],
  companySizes: [],
  regions: [],
  buyerTitles: [],
  signals: [],
}

/** Form state keeps raw text so half-typed URLs and blank rows survive edits. */
type ProfileDraft = Omit<StudioProfile, 'excludedDomains'> & { excludedText: string }

function chipsFrom(profile: Pick<StudioProfile, ChipKey>): ChipOptions {
  return {
    services: profile.services,
    industries: profile.industries,
    companySizes: profile.companySizes,
    regions: profile.regions,
    buyerTitles: profile.buyerTitles,
    signals: profile.signals,
  }
}

function mergeLabels(suggested: string[], current: string[]) {
  const seen = new Set(suggested.map((value) => value.toLowerCase()))
  const extras = current.filter((value) => value.trim() && !seen.has(value.toLowerCase()))
  return [...suggested, ...extras]
}

function fillBlankRows(current: string[], incoming: string[], min: number) {
  if (current.some((value) => value.trim())) return padRows(current, min)
  return padRows(incoming, min)
}

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
  if (!profile.companyName?.trim()) missing.push('your company name')
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
  const [chips, setChips] = useState<ChipOptions>(() => chipsFrom(initial))
  const [websiteTouched, setWebsiteTouched] = useState(false)
  const [nameTouched, setNameTouched] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [readError, setReadError] = useState<string | null>(null)
  const [prefilledFrom, setPrefilledFrom] = useState<string | null>(() =>
    initial.services.length > 0 ? normalizeDomain(initial.website) : null,
  )
  const analyzedDomain = useRef<string | null>(prefilledFrom)
  const readToken = useRef(0)
  const reading = useRef(false)

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

  const companyName = values.companyName?.trim() ?? ''
  const canRead = !!companyName && !!websiteDomain && !analyzing && !busy
  const nameInvalid = nameTouched && !companyName
  const studioComplete = !!companyName && !!websiteDomain && profile.services.length > 0
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

  function selectChips(key: ChipKey, next: string[]) {
    setChips((prev) => {
      const seen = new Set(prev[key].map((item) => item.toLowerCase()))
      const extras = next.filter((item) => !seen.has(item.toLowerCase()))
      return extras.length === 0 ? prev : { ...prev, [key]: [...prev[key], ...extras] }
    })
    update(key, next)
  }

  function removeChip(key: ChipKey, value: string) {
    const drop = (item: string) => item.toLowerCase() !== value.toLowerCase()
    setChips((prev) => ({ ...prev, [key]: prev[key].filter(drop) }))
    update(key, valuesRef.current[key].filter(drop))
  }

  function setSection(key: SectionKey, next: boolean) {
    setOpen((prev) => ({ ...prev, [key]: next }))
  }

  function handleWebsiteChange(value: string) {
    const nextDomain = normalizeDomain(value)
    const domainChanged = !!prefilledFrom && nextDomain !== prefilledFrom
    readToken.current += 1
    reading.current = false
    setAnalyzing(false)
    if (!domainChanged) {
      setDraft({ ...valuesRef.current, website: value })
      return
    }
    analyzedDomain.current = null
    setPrefilledFrom(null)
    setReadError(null)
    setChips(EMPTY_CHIPS)
    setDraft({
      ...valuesRef.current,
      website: value,
      services: [],
      industries: [],
      companySizes: [],
      regions: [],
      buyerTitles: [],
      signals: [],
    })
  }

  function applyRead(data: WebsiteRead, domain: string) {
    const current = valuesRef.current
    const services = mergeLabels(data.services, current.services)
    const industries = mergeLabels(data.industries, current.industries)
    const companySizes = mergeLabels(data.companySizes, current.companySizes)
    const regions = mergeLabels(data.regions, current.regions)
    const buyerTitles = mergeLabels(data.buyerTitles, current.buyerTitles)
    const signals = mergeLabels(data.signals, current.signals)
    setChips({ services, industries, companySizes, regions, buyerTitles, signals })
    setDraft({
      ...current,
      companyName: current.companyName?.trim() || data.companyName,
      services,
      industries,
      companySizes,
      regions,
      buyerTitles,
      signals,
      caseStudies: fillBlankRows(current.caseStudies, data.caseStudies, 1),
      seedClients: fillBlankRows(current.seedClients, data.seedClients, 2),
      dealSize: current.dealSize ?? data.dealSize ?? undefined,
    })
    setPrefilledFrom(domain)
    analyzedDomain.current = domain
    setOpen((prev) => ({ ...prev, studio: true, clients: true }))
  }

  async function readSite(force = false) {
    const domain = normalizeDomain(valuesRef.current.website)
    const name = valuesRef.current.companyName?.trim() ?? ''
    if (!domain || !name) return
    if (reading.current) return
    if (!force && analyzedDomain.current === domain) return
    const token = ++readToken.current
    reading.current = true
    setAnalyzing(true)
    setReadError(null)
    try {
      const result = await readStudioWebsite({ companyName: name, website: domain })
      if (token !== readToken.current) return
      if (!result.ok) {
        setReadError(result.error)
        return
      }
      applyRead(result.data, domain)
    } finally {
      if (token === readToken.current) {
        reading.current = false
        setAnalyzing(false)
      }
    }
  }

  function fillSample() {
    readToken.current += 1
    reading.current = false
    analyzedDomain.current = sampleProfile.website
    setAnalyzing(false)
    setReadError(null)
    setPrefilledFrom(sampleProfile.website)
    setWebsiteTouched(false)
    setNameTouched(false)
    setChips(chipsFrom(sampleProfile))
    setDraft(fromProfile(sampleProfile))
    setOpen((prev) => ({ ...prev, studio: true, clients: true }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ready || busy) return
    setOpen({ studio: false, clients: false, deal: false })
    onSubmit(profile)
  }

  const showEnrichAction = !enriched || isStale

  return (
    <div className="flex flex-col gap-6">
      <StepHeading
        eyebrow="Step 1"
        title="Tell us about your studio."
        description="Your company name and website. We’ll read the site and suggest who you sell to."
      />

      <form id="profile-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <FormSection
          id="section-studio"
          index={1}
          title="Your studio"
          description="Name and website. Everything else comes from the site."
          summary={studioSummary}
          icon={Palette}
          tone="purple"
          complete={studioComplete}
          open={open.studio}
          onOpenChange={(next) => setSection('studio', next)}
        >
          <FieldGroup className="gap-6">
            <Field data-invalid={nameInvalid}>
              <FieldLabel htmlFor="companyName">Company name</FieldLabel>
              <Input
                id="companyName"
                value={values.companyName ?? ''}
                onChange={(event) => update('companyName', event.target.value)}
                onBlur={() => {
                  setNameTouched(true)
                  void readSite()
                }}
                placeholder="Revlo"
                autoComplete="organization"
                required
                aria-invalid={nameInvalid}
                aria-describedby={nameInvalid ? 'company-name-error' : undefined}
              />
              {nameInvalid ? (
                <p id="company-name-error" className="text-paragraph-xs text-error-base">
                  Enter the company name.
                </p>
              ) : null}
            </Field>

            <Field data-invalid={websiteInvalid || !!readError}>
              <FieldLabel htmlFor="website">Website</FieldLabel>
              <Input
                id="website"
                value={values.website}
                onChange={(event) => handleWebsiteChange(event.target.value)}
                onBlur={() => {
                  setWebsiteTouched(true)
                  void readSite()
                }}
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
                  <p className="text-paragraph-xs text-error-base">Enter your website, like yourstudio.com</p>
                ) : analyzing ? (
                  <p className="flex items-center gap-1.5 text-paragraph-xs">
                    <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                    Reading your site…
                  </p>
                ) : readError ? (
                  <p className="text-paragraph-xs text-error-base">{readError}</p>
                ) : prefilledFrom && prefilledFrom === websiteDomain ? (
                  <div className="flex flex-col gap-0.5">
                    <p className="text-paragraph-xs">Suggestions are in from the site. Turn off anything that doesn’t fit.</p>
                  </div>
                ) : (
                  <p className="text-paragraph-xs">We’ll read the site once the name and website are filled in.</p>
                )}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setNameTouched(true)
                  setWebsiteTouched(true)
                  void readSite(true)
                }}
                disabled={!canRead}
                className="self-start"
              >
                {analyzing ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
                {prefilledFrom ? 'Read again' : 'Read site'}
              </Button>
            </Field>

            <ChipField
              id="services"
              legend="What you do"
              description={chips.services.length ? 'From your site. Remove any that don’t fit.' : 'Type what you sell, then press Enter.'}
              options={chips.services}
              selected={values.services}
              onChange={(next) => selectChips('services', next)}
              onRemove={(value) => removeChip('services', value)}
              addLabel="Add a service"
              addPlaceholder="Web design"
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
          description="Who you sell to. These update from the site — nothing here is a fixed list."
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
              description="The industries your buyers are in."
              options={chips.industries}
              selected={values.industries}
              onChange={(next) => selectChips('industries', next)}
              onRemove={(value) => removeChip('industries', value)}
              addLabel="Add an industry"
              addPlaceholder="Creative studios"
              selectedClassName={tagColorClass}
            />

            <ChipField
              id="companySizes"
              legend="Their company size"
              description="Employees at the companies you sell to."
              options={chips.companySizes}
              selected={values.companySizes}
              onChange={(next) => selectChips('companySizes', next)}
              onRemove={(value) => removeChip('companySizes', value)}
              addLabel="Add a company size"
              addPlaceholder="11–50"
            />

            <ChipField
              id="regions"
              legend="Regions"
              description="Where those companies are."
              options={chips.regions}
              selected={values.regions}
              onChange={(next) => selectChips('regions', next)}
              onRemove={(value) => removeChip('regions', value)}
              addLabel="Add a region"
              addPlaceholder="United States"
            />

            <ChipField
              id="buyerTitles"
              legend="Who signs off"
              description="The person who hires you."
              options={chips.buyerTitles}
              selected={values.buyerTitles}
              onChange={(next) => selectChips('buyerTitles', next)}
              onRemove={(value) => removeChip('buyerTitles', value)}
              addLabel="Add a title"
              addPlaceholder="Founder"
            />

            <ChipField
              id="signals"
              legend={
                <>
                  Best time to reach them <OptionalTag />
                </>
              }
              description="Moments that make a buyer ready. Optional."
              options={chips.signals}
              selected={values.signals}
              onChange={(next) => selectChips('signals', next)}
              onRemove={(value) => removeChip('signals', value)}
              addLabel="Add a signal"
              addPlaceholder="Hiring a producer"
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
        <div className="flex flex-col gap-4 border-t border-stroke-soft-200 pt-5">
          {!ready ? (
            <p className="text-paragraph-xs text-pretty text-text-sub-600" aria-live="polite">
              Still needed: {missing.join(', ')}.
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
            {process.env.NODE_ENV === 'development' ? (
              <Button type="button" variant="ghost" onClick={fillSample} disabled={busy}>
                <WandSparkles />
                Fill with a sample
              </Button>
            ) : null}
            <Button
              type="submit"
              form="profile-form"
              pending={pendingEnrich}
              disabled={pendingMatch || !ready}
              className="w-full sm:w-auto"
            >
              {pendingEnrich ? null : <Sparkles />}
              {pendingEnrich ? 'Building profile' : enriched ? 'Update profile' : 'Build my profile'}
            </Button>
          </div>
        </div>
      ) : null}

      {enriched || pendingEnrich ? (
        <section
          id="shortlist-profile"
          aria-labelledby="shortlist-profile-heading"
          aria-live="polite"
          className="flex scroll-mt-6 flex-col gap-4 pt-4"
        >
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="shortlist-profile-heading" className="section-title">
              Your GTM profile
            </h2>
            <p className="text-paragraph-xs">{isStale ? 'Inputs changed. Update to refresh.' : 'Drives every lead and post'}</p>
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
                pending={pendingEnrich}
                disabled={pendingMatch || !ready}
              >
                {pendingEnrich ? null : <RefreshCw />}
                Regenerate
              </Button>
              <Button onClick={onFindAccounts} pending={pendingMatch} disabled={pendingEnrich}>
                {pendingMatch ? 'Opening audience' : 'Continue to audience'}
                {pendingMatch ? null : <ArrowRight />}
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
