import { AtSign, BookOpen, PenLine, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CompleteButton } from '@/components/gtm/complete-button'
import { CopyButton } from '@/components/gtm/copy-button'
import type { ContentChannel, Digest } from '@/lib/gtm/schemas'
import { TONES, type Tone } from '@/lib/gtm/tones'
import { cn } from '@/lib/utils'

function ContentItem({
  eyebrow,
  icon: Icon,
  tone,
  copyText,
  done,
  onToggle,
  children,
}: {
  eyebrow: string
  icon: LucideIcon
  tone: Tone
  copyText: string
  done: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col gap-3 px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span className={cn('flex size-6 items-center justify-center rounded-md', TONES[tone].tile)}>
            <Icon className="size-3.5" aria-hidden="true" />
          </span>
          <p className="text-meta">{eyebrow}</p>
        </div>
        <div className={cn('flex flex-col gap-3 transition-opacity', done && 'line-clamp-2 opacity-60')}>{children}</div>
        <div className="-mx-2 flex items-center justify-between gap-2">
          <CopyButton text={copyText} />
          <CompleteButton done={done} onToggle={onToggle} label={eyebrow} />
        </div>
      </CardContent>
    </Card>
  )
}

export function ContentPanel({
  digest,
  channels,
  completed,
  onToggle,
}: {
  digest: Digest | null
  channels: ContentChannel[]
  completed: Set<string>
  onToggle: (key: string) => void
}) {
  const has = (channel: ContentChannel) => channels.includes(channel)
  const hasAny = has('linkedinPost') || has('xPost') || has('blogIdea')

  return (
    <section id="content" aria-labelledby="content-heading" className="flex scroll-mt-6 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="content-heading" className="text-label">
          Content of the week
        </h2>
      </div>

      {!digest ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading content">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : !hasAny ? (
        <p className="rounded-xl bg-muted px-5 py-4 text-description">
          No post or blog content selected. Turn channels on in Settings.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {has('linkedinPost') ? (
            <ContentItem
              eyebrow="LinkedIn post idea"
              icon={PenLine}
              tone="sky"
              copyText={`${digest.linkedinPost.hook}\n\n${digest.linkedinPost.body}`}
              done={completed.has('content-linkedinPost')}
              onToggle={() => onToggle('content-linkedinPost')}
            >
              <p className="text-label text-pretty">{digest.linkedinPost.hook}</p>
              <p className="whitespace-pre-line text-body text-pretty">{digest.linkedinPost.body}</p>
            </ContentItem>
          ) : null}

          {has('xPost') ? (
            <ContentItem
              eyebrow="X post"
              icon={AtSign}
              tone="purple"
              copyText={digest.xPost}
              done={completed.has('content-xPost')}
              onToggle={() => onToggle('content-xPost')}
            >
              <p className="whitespace-pre-line text-body text-pretty">{digest.xPost}</p>
              <p className="text-meta tabular">{digest.xPost.length}/280</p>
            </ContentItem>
          ) : null}

          {has('blogIdea') ? (
            <ContentItem
              eyebrow="Blog idea prompt"
              icon={BookOpen}
              tone="orange"
              copyText={`${digest.blogIdea.title}\n\n${digest.blogIdea.angle}\n\n${digest.blogIdea.outline
                .map((h, i) => `${i + 1}. ${h}`)
                .join('\n')}`}
              done={completed.has('content-blogIdea')}
              onToggle={() => onToggle('content-blogIdea')}
            >
              <p className="text-label text-pretty">{digest.blogIdea.title}</p>
              <p className="text-description text-pretty">{digest.blogIdea.angle}</p>
              <ol className="flex flex-col gap-1.5">
                {digest.blogIdea.outline.map((heading, i) => (
                  <li key={heading} className="flex gap-3 text-body">
                    <span className="text-meta tabular">{String(i + 1).padStart(2, '0')}</span>
                    {heading}
                  </li>
                ))}
              </ol>
            </ContentItem>
          ) : null}
        </div>
      )}
    </section>
  )
}
