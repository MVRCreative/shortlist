import { Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatUsd, quoteMonthlyPrice } from '@/lib/gtm/pricing'
import type { DigestSettings, EnrichedProfile, ProfileInput } from '@/lib/gtm/schemas'
import { tagColorClass } from '@/lib/gtm/tag-colors'

function Placeholder({ className }: { className: string }) {
  return <span aria-hidden="true" className={`block rounded-full bg-muted ${className}`} />
}

function PreviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-eyebrow">{label}</p>
      {children}
    </div>
  )
}

function TextOrPlaceholder({ value, lines = 1 }: { value: string; lines?: number }) {
  if (value.trim()) return <p className="line-clamp-3 text-body text-pretty">{value}</p>
  return (
    <div className="flex flex-col gap-1.5 py-1">
      {Array.from({ length: lines }).map((_, i) => (
        <Placeholder key={i} className={i === lines - 1 ? 'h-2 w-3/5' : 'h-2 w-full'} />
      ))}
    </div>
  )
}

export function ProfilePreview({
  input,
  enriched,
  fitCount,
  missCount,
  settings,
}: {
  input: ProfileInput
  enriched: EnrichedProfile | null
  fitCount: number
  missCount: number
  settings: DigestSettings
}) {
  const initial = input.companyName.trim().charAt(0).toUpperCase()
  const { total } = quoteMonthlyPrice(settings)

  return (
    <div className="flex flex-col gap-4 py-6">
      <div className="flex items-center justify-between">
        <p className="text-label">Profile preview</p>
        <p className="text-meta">Updates as you go</p>
      </div>
      <Card className="gap-0 py-0">
        <CardContent className="flex flex-col gap-5 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-control-md shrink-0 items-center justify-center rounded-xl bg-muted text-section-title">
              {initial || <Globe className="size-icon-sm text-muted-foreground" aria-hidden="true" />}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              {input.companyName.trim() ? (
                <p className="truncate text-section-title">{input.companyName}</p>
              ) : (
                <Placeholder className="h-3 w-28" />
              )}
              {input.website.trim() ? (
                <p className="truncate text-meta">{input.website}</p>
              ) : (
                <Placeholder className="h-2 w-20" />
              )}
            </div>
          </div>

          {enriched ? (
            <>
              <p className="text-body text-pretty">{enriched.oneLiner}</p>
              <Badge variant="neutral" className="w-fit">
                {enriched.category}
              </Badge>
            </>
          ) : (
            <PreviewRow label="What you sell">
              <TextOrPlaceholder value={input.offering} lines={3} />
            </PreviewRow>
          )}

          <Separator />

          {enriched ? (
            <>
              <PreviewRow label="Industries">
                <ul className="flex flex-wrap gap-1.5">
                  {enriched.icp.industries.map((industry) => (
                    <li key={industry}>
                      <Badge variant="secondary" className={tagColorClass(industry)}>
                        {industry}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </PreviewRow>
              <PreviewRow label="Buyers">
                <p className="text-body text-pretty">{enriched.icp.buyerTitles.join(', ')}</p>
              </PreviewRow>
              <PreviewRow label="Size · Regions">
                <p className="text-body text-pretty">
                  {enriched.icp.companySize} · {enriched.icp.regions.join(', ')}
                </p>
              </PreviewRow>
            </>
          ) : (
            <PreviewRow label="Who you sell to">
              <TextOrPlaceholder value={input.targetMarket} lines={2} />
            </PreviewRow>
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

      {enriched ? (
        <div className="flex items-baseline justify-between rounded-xl bg-muted px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <p className="text-label">
              {settings.leadsPerDigest} leads · {settings.cadence}
            </p>
            <p className="text-meta">
              {settings.channels.length} content type{settings.channels.length === 1 ? '' : 's'}
            </p>
          </div>
          <p className="tabular">
            <span className="text-section-title">{formatUsd(total)}</span>
            <span className="text-meta"> / mo</span>
          </p>
        </div>
      ) : null}
    </div>
  )
}
