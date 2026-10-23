import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { StepHeading } from '@/components/gtm/step-heading'
import type { EnrichedProfile, ProfileInput } from '@/lib/gtm/schemas'

function ProfileRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-eyebrow">{label}</p>
      {children}
    </div>
  )
}

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item}>
          <Badge variant="secondary">{item}</Badge>
        </li>
      ))}
    </ul>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-body">
          <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
          <span className="text-pretty">{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function EnrichStep({
  input,
  profile,
  pendingMatch,
  pendingEnrich,
  onBack,
  onRegenerate,
  onContinue,
}: {
  input: ProfileInput
  profile: EnrichedProfile
  pendingMatch: boolean
  pendingEnrich: boolean
  onBack: () => void
  onRegenerate: () => void
  onContinue: () => void
}) {
  return (
    <div className="flex flex-col gap-8">
      <StepHeading
        eyebrow="Your GTM profile"
        title={`Here’s how we see ${input.companyName}.`}
        description="This profile drives every account we match and every piece of content we write. Make sure it sounds right."
      />

      <Card>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Badge variant="brand" className="w-fit">
              {profile.category}
            </Badge>
            <p className="text-section-title text-pretty">{profile.oneLiner}</p>
            <p className="text-description text-pretty">{profile.valueProp}</p>
          </div>

          <Separator />

          <div className="grid gap-6 sm:grid-cols-2">
            <ProfileRow label="Pains solved">
              <Bullets items={profile.painsSolved} />
            </ProfileRow>
            <ProfileRow label="Differentiators">
              <Bullets items={profile.differentiators} />
            </ProfileRow>
          </div>

          <Separator />

          <div className="grid gap-6 sm:grid-cols-2">
            <ProfileRow label="Industries">
              <Chips items={profile.icp.industries} />
            </ProfileRow>
            <ProfileRow label="Buyer titles">
              <Chips items={profile.icp.buyerTitles} />
            </ProfileRow>
            <ProfileRow label="Company size">
              <p className="text-body">{profile.icp.companySize}</p>
            </ProfileRow>
            <ProfileRow label="Regions">
              <p className="text-body">{profile.icp.regions.join(', ')}</p>
            </ProfileRow>
          </div>

          <Separator />

          <ProfileRow label="Buying signals">
            <Bullets items={profile.buyingSignals} />
          </ProfileRow>
          <ProfileRow label="Brand voice">
            <p className="text-body text-pretty text-muted-foreground">{profile.voice}</p>
          </ProfileRow>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1">
          <Button variant="ghost" tone="muted" onClick={onBack} disabled={pendingMatch || pendingEnrich}>
            <ArrowLeft />
            Edit inputs
          </Button>
          <Button variant="ghost" tone="muted" onClick={onRegenerate} pending={pendingEnrich} disabled={pendingMatch}>
            {pendingEnrich ? null : <RefreshCw />}
            Regenerate
          </Button>
        </div>
        <Button size="lg" onClick={onContinue} pending={pendingMatch} disabled={pendingEnrich}>
          {pendingMatch ? 'Finding accounts' : 'Find accounts'}
          {pendingMatch ? null : <ArrowRight />}
        </Button>
      </div>
    </div>
  )
}
