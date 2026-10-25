import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import type { EnrichedProfile } from '@/lib/shortlist/schemas'
import { tagColorClass } from '@/lib/shortlist/tag-colors'
import { TONES, type Tone } from '@/lib/shortlist/tones'

function ProfileRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-paragraph-xs">{label}</p>
      {children}
    </div>
  )
}

function Chips({ items, colorful = false }: { items: string[]; colorful?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item}>
          <Badge variant="secondary" className={colorful ? tagColorClass(item) : undefined}>
            {item}
          </Badge>
        </li>
      ))}
    </ul>
  )
}

function Bullets({ items, tone }: { items: string[]; tone: Tone }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-paragraph-sm">
          <span aria-hidden="true" className={`mt-2 size-1.5 shrink-0 rounded-full bg-current ${TONES[tone].ink}`} />
          <span className="text-pretty">{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function EnrichedProfileCard({ profile }: { profile: EnrichedProfile }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Badge variant="secondary" className={`w-fit ${TONES.purple.chip}`}>
            {profile.category}
          </Badge>
          <p className="text-label-sm text-pretty">{profile.oneLiner}</p>
          <p className="text-paragraph-sm text-pretty">{profile.valueProp}</p>
        </div>

        <Separator />

        <div className="grid gap-6 sm:grid-cols-2">
          <ProfileRow label="Pains solved">
            <Bullets items={profile.painsSolved} tone="pink" />
          </ProfileRow>
          <ProfileRow label="Differentiators">
            <Bullets items={profile.differentiators} tone="green" />
          </ProfileRow>
        </div>

        <Separator />

        <div className="grid gap-6 sm:grid-cols-2">
          <ProfileRow label="Industries">
            <Chips items={profile.icp.industries} colorful />
          </ProfileRow>
          <ProfileRow label="Buyer titles">
            <Chips items={profile.icp.buyerTitles} />
          </ProfileRow>
          <ProfileRow label="Company size">
            <p className="text-paragraph-sm">{profile.icp.companySize}</p>
          </ProfileRow>
          <ProfileRow label="Regions">
            <p className="text-paragraph-sm">{profile.icp.regions.join(', ')}</p>
          </ProfileRow>
        </div>

        <Separator />

        <ProfileRow label="Buying signals">
          <Bullets items={profile.buyingSignals} tone="orange" />
        </ProfileRow>
        <ProfileRow label="Brand voice">
          <p className="text-paragraph-sm text-pretty text-text-sub-600">{profile.voice}</p>
        </ProfileRow>
      </CardContent>
    </Card>
  )
}

export function EnrichedProfileSkeleton() {
  return (
    <Card aria-busy="true" aria-label="Building your profile">
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/5" />
        </div>
        <Separator />
        <div className="grid gap-6 sm:grid-cols-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}
