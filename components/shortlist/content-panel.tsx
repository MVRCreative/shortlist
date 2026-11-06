'use client'

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { CopyButton } from '@/components/shortlist/copy-button'
import { DoneCheck } from '@/components/shortlist/done-check'
import type {
  CampaignAssetId,
  CampaignContent,
  CampaignCopyDraft,
  CampaignCopyPatch,
} from '@/lib/shortlist/campaign-content'
import type { ContentChannel, Digest } from '@/lib/shortlist/schemas'
import { cn } from '@/lib/utils'

const fieldClass = 'min-h-24 text-base md:text-paragraph-sm'

function linkedinCopy(content: CampaignContent) {
  return [content.linkedinPost.hook, content.linkedinPost.body].filter(Boolean).join('\n\n')
}

function blogCopy(content: CampaignContent) {
  const outline = content.blogIdea.outline.map((heading, index) => `${index + 1}. ${heading}`).join('\n')
  return [content.blogIdea.title, content.blogIdea.angle, outline].filter(Boolean).join('\n\n')
}

function outlineValue(content: CampaignContent, draft: CampaignCopyDraft | null) {
  if (draft?.sourceKey === content.sourceKey && draft.blogOutline !== undefined) return draft.blogOutline
  return content.blogIdea.outline.join('\n')
}

export function ContentPanel({
  digest,
  channels,
  content,
  draft,
  published,
  onEdit,
  onTogglePublished,
  sectionId = 'campaign-content',
}: {
  digest: Digest | null
  channels: ContentChannel[]
  content: CampaignContent
  draft: CampaignCopyDraft | null
  published: Set<CampaignAssetId>
  onEdit: (patch: CampaignCopyPatch) => void
  onTogglePublished: (id: CampaignAssetId) => void
  sectionId?: string
}) {
  const [editing, setEditing] = useState<CampaignAssetId | null>(null)
  const has = (channel: ContentChannel) => channels.includes(channel)
  const intro = content.campaignName
    ? `For ${content.campaignName}. You publish these yourself.`
    : 'From your profile and audience. You publish these yourself.'

  return (
    <section id={sectionId} aria-labelledby={`${sectionId}-heading`} className="flex scroll-mt-8 flex-col">
      <div className="flex flex-col gap-1 px-4 pb-4 sm:px-6 lg:px-8 xl:px-5">
        <h2 id={`${sectionId}-heading`} className="kicker">
          Campaign content
        </h2>
        <p className="text-paragraph-xs text-pretty text-text-sub-600">{intro}</p>
      </div>

      {!digest ? (
        <div className="flex flex-col border-t border-stroke-soft-200" aria-busy="true" aria-label="Loading campaign content">
          <Skeleton className="h-28 w-full rounded-none" />
          <Skeleton className="h-24 w-full rounded-none" />
        </div>
      ) : (
        <div className="border-t border-stroke-soft-200">
          {has('linkedinPost') ? (
            <Asset
              kind="LinkedIn post"
              purpose={content.linkedinPost.purpose}
              title={content.linkedinPost.hook}
              copyText={linkedinCopy(content)}
              published={published.has('linkedinPost')}
              editing={editing === 'linkedinPost'}
              onToggle={() => onTogglePublished('linkedinPost')}
              onEditToggle={() => setEditing((current) => (current === 'linkedinPost' ? null : 'linkedinPost'))}
            >
              {editing === 'linkedinPost' ? (
                <Fields>
                  <Field label="Hook">
                    <Textarea
                      value={content.linkedinPost.hook}
                      onChange={(event) => onEdit({ linkedinHook: event.target.value })}
                      rows={2}
                      className={cn(fieldClass, 'min-h-16')}
                      aria-label="LinkedIn hook"
                    />
                  </Field>
                  <Field label="Post">
                    <Textarea
                      value={content.linkedinPost.body}
                      onChange={(event) => onEdit({ linkedinBody: event.target.value })}
                      rows={6}
                      className={fieldClass}
                      aria-label="LinkedIn post"
                    />
                  </Field>
                </Fields>
              ) : (
                <CopyBlock published={published.has('linkedinPost')}>
                  {content.linkedinPost.body ? (
                    <p className="whitespace-pre-line text-paragraph-sm text-pretty">{content.linkedinPost.body}</p>
                  ) : null}
                </CopyBlock>
              )}
            </Asset>
          ) : null}

          {has('xPost') ? (
            <Asset
              kind="X post"
              purpose={content.xPost.purpose}
              title={content.xPost.title}
              meta={`${content.xPost.body.length}/280`}
              metaTone={content.xPost.body.length > 280 ? 'over' : 'ok'}
              copyText={content.xPost.body}
              published={published.has('xPost')}
              editing={editing === 'xPost'}
              onToggle={() => onTogglePublished('xPost')}
              onEditToggle={() => setEditing((current) => (current === 'xPost' ? null : 'xPost'))}
            >
              {editing === 'xPost' ? (
                <Field label="Post">
                  <Textarea
                    value={content.xPost.body}
                    onChange={(event) => onEdit({ xBody: event.target.value })}
                    rows={4}
                    className={fieldClass}
                    aria-label="X post"
                  />
                </Field>
              ) : (
                <CopyBlock published={published.has('xPost')}>
                  <p className="whitespace-pre-line text-paragraph-sm text-pretty">{content.xPost.body}</p>
                </CopyBlock>
              )}
            </Asset>
          ) : null}

          {has('blogIdea') ? (
            <Asset
              kind="Article"
              purpose={content.blogIdea.purpose}
              title={content.blogIdea.title}
              copyText={blogCopy(content)}
              published={published.has('blogIdea')}
              editing={editing === 'blogIdea'}
              onToggle={() => onTogglePublished('blogIdea')}
              onEditToggle={() => setEditing((current) => (current === 'blogIdea' ? null : 'blogIdea'))}
            >
              {editing === 'blogIdea' ? (
                <Fields>
                  <Field label="Title">
                    <Textarea
                      value={content.blogIdea.title}
                      onChange={(event) => onEdit({ blogTitle: event.target.value })}
                      rows={2}
                      className={cn(fieldClass, 'min-h-16')}
                      aria-label="Article title"
                    />
                  </Field>
                  <Field label="Angle">
                    <Textarea
                      value={content.blogIdea.angle}
                      onChange={(event) => onEdit({ blogAngle: event.target.value })}
                      rows={3}
                      className={fieldClass}
                      aria-label="Article angle"
                    />
                  </Field>
                  <Field label="Outline" hint="One section per line.">
                    <Textarea
                      value={outlineValue(content, draft)}
                      onChange={(event) => onEdit({ blogOutline: event.target.value })}
                      rows={5}
                      className={fieldClass}
                      aria-label="Article outline"
                    />
                  </Field>
                </Fields>
              ) : (
                <CopyBlock published={published.has('blogIdea')}>
                  <p className="text-paragraph-sm text-pretty text-text-sub-600">{content.blogIdea.angle}</p>
                  {content.blogIdea.outline.length > 0 ? (
                    <ol className="flex flex-col gap-1.5 border-t border-stroke-soft-200 pt-2">
                      {content.blogIdea.outline.map((heading, index) => (
                        <li key={`${index}-${heading}`} className="flex gap-2 text-paragraph-xs text-text-sub-600">
                          <span className="tabular-nums text-text-strong-950/70">{index + 1}.</span>
                          <span>{heading}</span>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </CopyBlock>
              )}
            </Asset>
          ) : null}

          {!has('linkedinPost') && !has('xPost') && !has('blogIdea') ? (
            <p className="px-4 py-4 text-paragraph-xs text-text-sub-600 sm:px-6 lg:px-8 xl:px-5">
              Campaign content is turned off for this plan.
            </p>
          ) : null}
        </div>
      )}
    </section>
  )
}

function Asset({
  kind,
  purpose,
  title,
  meta,
  metaTone = 'ok',
  copyText,
  published,
  editing,
  onToggle,
  onEditToggle,
  children,
}: {
  kind: string
  purpose: string
  title: string
  meta?: string
  metaTone?: 'ok' | 'over'
  copyText: string
  published: boolean
  editing: boolean
  onToggle: () => void
  onEditToggle: () => void
  children: React.ReactNode
}) {
  const showTitle = title.trim().length > 0 && title.trim() !== kind
  return (
    <article className="flex flex-col gap-3 border-b border-stroke-soft-200 px-4 py-4 last:border-b-0 sm:px-6 lg:px-8 xl:px-5">
      <div className="flex items-start gap-2">
        <DoneCheck done={published} verb="published" label={kind} onToggle={onToggle} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-label-sm font-normal text-text-strong-950">
            <span className={cn(published && 'line-through decoration-text-sub-600/40')}>{kind}</span>
          </h3>
          {published ? <p className="text-paragraph-xs text-text-sub-600">Marked published</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {meta ? (
            <span
              className={cn(
                'text-paragraph-xs tabular-nums',
                metaTone === 'over' ? 'text-error-base' : 'text-text-sub-600',
              )}
            >
              {meta}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onEditToggle}
            aria-expanded={editing}
            className="px-1 text-paragraph-xs text-text-sub-600 fine-hover:text-text-strong-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base"
          >
            {editing ? 'Done' : 'Edit'}
          </button>
          <CopyButton text={copyText} label={`Copy ${kind}`} iconOnly />
        </div>
      </div>
      <p className="text-paragraph-sm text-pretty text-text-sub-600">{purpose}</p>
      {showTitle && !editing ? (
        <p className="text-label-sm font-normal text-pretty text-text-strong-950">{title}</p>
      ) : null}
      {children}
    </article>
  )
}

function CopyBlock({ published, children }: { published: boolean; children: React.ReactNode }) {
  return <div className={cn('flex flex-col gap-2', published && 'line-clamp-4')}>{children}</div>
}

function Fields({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3">{children}</div>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-paragraph-xs text-text-sub-600">
        {label}
        {hint ? <span className="text-text-soft-400"> · {hint}</span> : null}
      </span>
      {children}
    </label>
  )
}
