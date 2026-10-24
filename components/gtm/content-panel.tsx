import { Skeleton } from '@/components/ui/skeleton'
import { CopyButton } from '@/components/gtm/copy-button'
import { DoneCheck } from '@/components/gtm/lead-list'
import type { ContentChannel, Digest } from '@/lib/gtm/schemas'
import { cn } from '@/lib/utils'

function ContentItem({
  eyebrow,
  meta,
  copyText,
  done,
  onToggle,
  children,
}: {
  eyebrow: string
  meta?: string
  copyText: string
  done: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <article className="flex flex-col gap-3 py-5 first:pt-0">
      <div className="flex items-center gap-2.5">
        <DoneCheck done={done} label={eyebrow} onToggle={onToggle} />
        <h3 className="flex-1 text-meta font-medium text-foreground">{eyebrow}</h3>
        {meta ? <span className="text-meta tabular-nums">{meta}</span> : null}
      </div>
      <div
        className={cn(
          'flex flex-col gap-2 pl-7.5 transition-opacity duration-150',
          done && 'line-clamp-2 opacity-50',
        )}
      >
        {children}
      </div>
      <div className="ml-5">
        <CopyButton text={copyText} />
      </div>
    </article>
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

  return (
    <section id="content" aria-labelledby="content-heading" className="flex scroll-mt-6 flex-col gap-4">
      <h2 id="content-heading" className="text-label">
        Content this week
      </h2>

      {!digest ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading content">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-3.5 w-1/4" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {has('linkedinPost') ? (
            <ContentItem
              eyebrow="LinkedIn post"
              copyText={`${digest.linkedinPost.hook}\n\n${digest.linkedinPost.body}`}
              done={completed.has('content-linkedinPost')}
              onToggle={() => onToggle('content-linkedinPost')}
            >
              <p className="text-label text-pretty">{digest.linkedinPost.hook}</p>
              <p className="line-clamp-6 whitespace-pre-line text-description text-pretty">{digest.linkedinPost.body}</p>
            </ContentItem>
          ) : null}

          {has('xPost') ? (
            <ContentItem
              eyebrow="X post"
              meta={`${digest.xPost.length}/280`}
              copyText={digest.xPost}
              done={completed.has('content-xPost')}
              onToggle={() => onToggle('content-xPost')}
            >
              <p className="whitespace-pre-line text-description text-pretty">{digest.xPost}</p>
            </ContentItem>
          ) : null}

          {has('blogIdea') ? (
            <ContentItem
              eyebrow="Blog idea"
              copyText={`${digest.blogIdea.title}\n\n${digest.blogIdea.angle}\n\n${digest.blogIdea.outline
                .map((h, i) => `${i + 1}. ${h}`)
                .join('\n')}`}
              done={completed.has('content-blogIdea')}
              onToggle={() => onToggle('content-blogIdea')}
            >
              <p className="text-label text-pretty">{digest.blogIdea.title}</p>
              <p className="text-description text-pretty">{digest.blogIdea.angle}</p>
              <ol className="flex flex-col gap-1">
                {digest.blogIdea.outline.map((heading, i) => (
                  <li key={heading} className="flex gap-2 text-meta">
                    <span className="tabular-nums">{i + 1}.</span>
                    <span className="text-foreground/80">{heading}</span>
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
