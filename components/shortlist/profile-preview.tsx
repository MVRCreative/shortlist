import type { ReactNode } from 'react'
import { Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { EnrichedProfile, ProfileInput } from '@/lib/shortlist/schemas'
import { describeSizeRange } from '@/lib/shortlist/profile-options'
import { TONES, toneFor } from '@/lib/shortlist/tones'
import { faviconUrl, normalizeDomain, studioName } from '@/lib/shortlist/url'

function Placeholder({ className }: { className: string }) {
  return <span aria-hidden="true" className={`block rounded-full bg-bg-weak-50 ${className}`} />
}

function PreviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-paragraph-xs">{label}</p>
      {children}
    </div>
  )
}

function TextOrPlaceholder({ value, lines = 1 }: { value: string; lines?: number }) {
  if (value.trim()) return <p className="line-clamp-3 text-paragraph-sm text-pretty">{value}</p>
  return (
    <div className="flex flex-col gap-1.5 py-1">
      {Array.from({ length: lines }).map((_, i) => (
        <Placeholder key={i} className={i === lines - 1 ? 'h-2 w-3/5' : 'h-2 w-full'} />
      ))}
    </div>
  )
}

type ProfileCardProps = {
  input: ProfileInput
  enriched: EnrichedProfile | null
  fitCount: number
  missCount: number
}

export function ProfilePreview({ footer, ...card }: ProfileCardProps & { footer?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="kicker">Profile preview</p>
        <p className="text-paragraph-xs text-text-sub-600">Updates as you go</p>
      </div>
      <ProfileCard {...card} />
      {footer ? <div className="pt-2">{footer}</div> : null}
    </div>
  )
}

export function ProfileCard({ input, enriched, fitCount, missCount }: ProfileCardProps) {
  const domain = normalizeDomain(input.website)
  const name = domain ? studioName(input) : ''
  const initial = name.charAt(0).toUpperCase()

  return (
      <Card className="gap-0 py-0">
        <CardContent className="flex flex-col gap-5 px-5 py-5">
          <div className="flex items-center gap-3">
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-20 text-label-sm transition-colors ${
                initial ? TONES[toneFor(name)].tile : 'bg-bg-weak-50'
              }`}
            >
              {initial || <Globe className="size-4 text-text-sub-600" aria-hidden="true" />}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              {name ? <p className="truncate text-label-sm">{name}</p> : <Placeholder className="h-3 w-28" />}
              {domain ? <p className="truncate text-paragraph-xs">{domain}</p> : <Placeholder className="h-2 w-20" />}
            </div>
          </div>

          {enriched ? (
            <>
              <p className="text-paragraph-sm text-pretty">{enriched.oneLiner}</p>
              <Badge variant="neutral" className="w-fit">
                {enriched.category}
              </Badge>
            </>
          ) : (
            <>
              <PreviewRow label="What you do">
                <TextOrPlaceholder value={input.services.join(', ')} lines={1} />
              </PreviewRow>
              {input.seedClients.length > 0 ? (
                <PreviewRow label="More clients like">
                  <ul className="flex flex-wrap gap-1.5">
                    {input.seedClients.map((client) => (
                      <li key={client} className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-paragraph-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element -- remote favicon */}
                        <img src={faviconUrl(client)} alt="" width={12} height={12} className="size-3 rounded-sm" />
                        {client}
                      </li>
                    ))}
                  </ul>
                </PreviewRow>
              ) : null}
            </>
          )}

          <Separator />

          {enriched ? (
            <>
              <PreviewRow label="Industries">
                <ul className="flex flex-wrap gap-1.5">
                  {enriched.icp.industries.map((industry) => (
                    <li key={industry}>
                      <Badge variant="secondary">
                        {industry}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </PreviewRow>
              <PreviewRow label="Buyers">
                <p className="text-paragraph-sm text-pretty">{enriched.icp.buyerTitles.join(', ')}</p>
              </PreviewRow>
              <PreviewRow label="Size · Regions">
                <p className="text-paragraph-sm text-pretty">
                  {enriched.icp.companySize} · {enriched.icp.regions.join(', ')}
                </p>
              </PreviewRow>
            </>
          ) : (
            <>
              <PreviewRow label="Industries">
                {input.industries.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {input.industries.map((industry) => (
                      <li key={industry}>
                        <Badge variant="secondary">
                          {industry}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <TextOrPlaceholder value="" lines={1} />
                )}
              </PreviewRow>
              {input.companySizes.length + input.regions.length > 0 ? (
                <PreviewRow label="Size · Regions">
                  <p className="text-paragraph-sm text-pretty">
                    {[describeSizeRange(input.companySizes), input.regions.join(', ')].filter(Boolean).join(' · ')}
                  </p>
                </PreviewRow>
              ) : null}
            </>
          )}

          {fitCount + missCount > 0 ? (
            <>
              <Separator />
              <PreviewRow label="Calibration">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="success">{fitCount} fit</Badge>
                  <Badge variant="neutral">{missCount} not a fit</Badge>
                </div>
              </PreviewRow>
            </>
          ) : null}
        </CardContent>
      </Card>
  )
}
