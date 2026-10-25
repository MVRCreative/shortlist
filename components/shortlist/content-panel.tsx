import { Skeleton } from '@/components/ui/skeleton'
import { CopyButton } from '@/components/shortlist/copy-button'
import { DoneCheck } from '@/components/shortlist/done-check'
import type { ContentChannel, Digest } from '@/lib/shortlist/schemas'
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
    <article
      className={cn(
        'flex flex-col gap-3 rounded-20 border border-stroke-soft-200 bg-bg-white-0 p-4 shadow-[var(--elevation-card)]',
        done && 'opacity-55',
      )}
    >
      <div className="flex items-center gap-2">
        <DoneCheck done={done} label={eyebrow} onToggle={onToggle} />
        <h3 className="min-w-0 flex-1 truncate text-label-sm text-text-strong-950">{eyebrow}</h3>
        {meta ? <span className="text-paragraph-xs tabular-nums text-text-sub-600">{meta}</span> : null}
        <CopyButton text={copyText} label={`Copy ${eyebrow}`} iconOnly />
      </div>
      <div className={cn('flex flex-col gap-2', done && 'line-clamp-2')}>{children}</div>
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
    <section id="content" aria-labelledby="content-heading" className="flex scroll-mt-8 flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="content-heading" className="text-label-sm">
          Content
        </h2>
        <p className="text-paragraph-xs text-text-sub-600">Optional this week</p>
      </div>

      {!digest ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading content">
          <Skeleton className="h-28 w-full rounded-20" />
          <Skeleton className="h-24 w-full rounded-20" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {has('linkedinPost') ? (
            <ContentItem
              eyebrow="LinkedIn post"
              copyText={`${digest.linkedinPost.hook}\n\n${digest.linkedinPost.body}`}
              done={completed.has('content-linkedinPost')}
              onToggle={() => onToggle('content-linkedinPost')}
            >
              <p className="text-label-sm text-pretty">{digest.linkedinPost.hook}</p>
              <p className="line-clamp-5 whitespace-pre-line text-paragraph-sm text-pretty text-text-sub-600">
                {digest.linkedinPost.body}
              </p>
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
              <p className="whitespace-pre-line text-paragraph-sm text-pretty">{digest.xPost}</p>
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
              <p className="text-label-sm text-pretty">{digest.blogIdea.title}</p>
              <p className="text-paragraph-sm text-pretty text-text-sub-600">{digest.blogIdea.angle}</p>
              <ol className="flex flex-col gap-1.5 border-t border-stroke-soft-200 pt-2">
                {digest.blogIdea.outline.map((heading, i) => (
                  <li key={heading} className="flex gap-2 text-paragraph-xs text-text-sub-600">
                    <span className="tabular-nums text-text-strong-950/70">{i + 1}.</span>
                    <span>{heading}</span>
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
