'use client'

import { format, addDays, nextMonday, startOfMonth, addMonths } from 'date-fns'
import { RefreshCw, Settings2, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Section, SectionHeader } from '@/components/ui/section'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CopyButton } from '@/components/gtm/copy-button'
import { channelLabels, type ContentChannel, type Digest, type DigestSettings } from '@/lib/gtm/schemas'

const shortChannelLabels: Record<ContentChannel, string> = {
  linkedinPost: 'Post',
  linkedinMessage: 'DMs',
  xPost: 'X',
  blogIdea: 'Blog',
}

function nextSendDate(cadence: DigestSettings['cadence']) {
  const today = new Date()
  if (cadence === 'weekly') return nextMonday(today)
  const firstOfNext = startOfMonth(addMonths(today, 1))
  return firstOfNext.getDay() === 1 ? firstOfNext : nextMonday(addDays(firstOfNext, -1))
}

function ContentCard({ copyText, children }: { copyText: string; children: React.ReactNode }) {
  return (
    <Card className="gap-4 py-5">
      <CardContent className="flex flex-col gap-3 px-5">{children}</CardContent>
      <div className="flex justify-end px-3">
        <CopyButton text={copyText} />
      </div>
    </Card>
  )
}

function DigestSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading digest">
      <Card className="gap-0 py-0">
        {Array.from({ length: Math.min(rows, 5) }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 border-b border-border px-5 py-4 last:border-0">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        ))}
      </Card>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  )
}

export function DigestStep({
  digest,
  settings,
  companyName,
  pending,
  onRegenerate,
  onEdit,
}: {
  digest: Digest | null
  settings: DigestSettings
  companyName: string
  pending: boolean
  onRegenerate: () => void
  onEdit: () => void
}) {
  const issueDate = format(new Date(), 'MMM d')
  const nextDate = format(nextSendDate(settings.cadence), 'EEE, MMM d')
  const firstChannel = settings.channels[0]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="success">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            Live
          </Badge>
          <p className="text-meta">
            Next digest {nextDate}
            {settings.email ? ` → ${settings.email}` : ''}
          </p>
        </div>
        <h1 className="text-editorial-title text-balance sm:text-editorial-display">
          {digest ? `${digest.theme}.` : 'Writing your first digest.'}
        </h1>
        <p className="text-body-reading text-muted-foreground">
          {companyName}’s {settings.cadence} digest · {issueDate}
        </p>
      </div>

      {!digest ? (
        <DigestSkeleton rows={settings.leadsPerDigest} />
      ) : (
        <>
          <Section>
            <SectionHeader
              heading={`${digest.leads.length} leads`}
              action={
                <CopyButton
                  label="Copy all"
                  text={digest.leads
                    .map((l) => `${l.contactName}, ${l.title} @ ${l.company} (${l.domain}) — ${l.angle}`)
                    .join('\n')}
                />
              }
            />
            <Card className="gap-0 py-0">
              <ol className="divide-y divide-border">
                {digest.leads.map((lead, i) => (
                  <li key={`${lead.contactName}-${i}`} className="flex gap-4 px-5 py-4">
                    <span className="w-5 shrink-0 pt-0.5 text-meta tabular" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="text-label">
                        {lead.contactName}
                        <span className="font-normal text-muted-foreground"> · {lead.title}</span>
                      </p>
                      <p className="text-meta">
                        {lead.company} · {lead.domain}
                      </p>
                      <p className="flex items-center gap-1.5 text-body text-foreground">
                        <Zap className="size-icon-xs shrink-0" aria-hidden="true" />
                        {lead.signal}
                      </p>
                      <p className="text-description text-pretty">{lead.angle}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </Section>

          {firstChannel ? (
            <Section>
              <SectionHeader heading="Content for this week" />
              <Tabs defaultValue={firstChannel} className="gap-4">
                <TabsList className="w-full">
                  {settings.channels.map((channel) => (
                    <TabsTrigger key={channel} value={channel} className="flex-1">
                      <span className="sm:hidden">{shortChannelLabels[channel]}</span>
                      <span className="hidden sm:inline">{channelLabels[channel]}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="linkedinPost">
                  <ContentCard copyText={`${digest.linkedinPost.hook}\n\n${digest.linkedinPost.body}`}>
                    <p className="text-label text-pretty">{digest.linkedinPost.hook}</p>
                    <p className="whitespace-pre-line text-body text-pretty">{digest.linkedinPost.body}</p>
                  </ContentCard>
                </TabsContent>

                <TabsContent value="linkedinMessage" className="flex flex-col gap-3">
                  {digest.linkedinMessages.map((msg) => (
                    <ContentCard key={msg.label} copyText={msg.message}>
                      <p className="text-eyebrow">{msg.label}</p>
                      <p className="whitespace-pre-line text-body text-pretty">{msg.message}</p>
                    </ContentCard>
                  ))}
                </TabsContent>

                <TabsContent value="xPost">
                  <ContentCard copyText={digest.xPost}>
                    <p className="whitespace-pre-line text-body-reading text-pretty">{digest.xPost}</p>
                    <p className="text-meta tabular">{digest.xPost.length}/280</p>
                  </ContentCard>
                </TabsContent>

                <TabsContent value="blogIdea">
                  <ContentCard
                    copyText={`${digest.blogIdea.title}\n\n${digest.blogIdea.angle}\n\n${digest.blogIdea.outline
                      .map((h, i) => `${i + 1}. ${h}`)
                      .join('\n')}`}
                  >
                    <p className="text-section-title text-pretty">{digest.blogIdea.title}</p>
                    <p className="text-description text-pretty">{digest.blogIdea.angle}</p>
                    <ol className="flex flex-col gap-1.5">
                      {digest.blogIdea.outline.map((heading, i) => (
                        <li key={heading} className="flex gap-3 text-body">
                          <span className="text-meta tabular">{String(i + 1).padStart(2, '0')}</span>
                          {heading}
                        </li>
                      ))}
                    </ol>
                  </ContentCard>
                </TabsContent>
              </Tabs>
            </Section>
          ) : null}
        </>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" tone="muted" onClick={onEdit} disabled={pending}>
          <Settings2 />
          Edit setup
        </Button>
        <Button variant="outline" onClick={onRegenerate} pending={pending}>
          {pending ? null : <RefreshCw />}
          Preview another week
        </Button>
      </div>
    </div>
  )
}
