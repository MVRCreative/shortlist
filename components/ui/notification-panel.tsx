/**
 * NotificationPanel
 *
 * The AlignUI notification content (community, person, body, unread dot,
 * filter, mark-read) laid out as a Loople page: the reading column, a page
 * title, and rows separated by space. Resting surfaces stay flat.
 *
 * Header icons and the unread dot are the exported AlignUI assets at their
 * own width and height.
 */
"use client"

import Image from "next/image"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function NotificationPanel({
  unreadOnly,
  onToggleUnread,
  onMarkAllRead,
  canMarkAllRead,
  children,
  footer,
}: {
  unreadOnly: boolean
  onToggleUnread: () => void
  onMarkAllRead: () => void
  canMarkAllRead: boolean
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <section className="flex w-full flex-col">
      <header className="flex min-h-touch items-center gap-2 px-4 py-3">
        <h1 className="min-w-0 flex-1 text-page-title">Notifications</h1>
        <button
          type="button"
          aria-pressed={unreadOnly}
          aria-label={unreadOnly ? "Showing unread" : "Show unread"}
          onClick={onToggleUnread}
          className={cn(
            "press flex size-touch items-center justify-center rounded-lg outline-none transition-colors duration-fast focus-visible:ring-3 focus-visible:ring-ring/50",
            unreadOnly ? "bg-muted" : "hover:bg-muted/50"
          )}
        >
          <Image src="/notifications/filter.svg" alt="" width={20} height={20} />
        </button>
        <button
          type="button"
          aria-label="Mark all as read"
          disabled={!canMarkAllRead}
          onClick={onMarkAllRead}
          className="press flex size-touch items-center justify-center rounded-lg outline-none transition-colors duration-fast hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40"
        >
          <Image src="/notifications/mark-read.svg" alt="" width={20} height={20} />
        </button>
      </header>
      <div className="flex flex-col gap-2 px-2 pb-2">{children}</div>
      {footer ? (
        <p className="px-4 pt-4 pb-6 text-center text-meta">{footer}</p>
      ) : null}
    </section>
  )
}

export function NotificationPanelRow({
  community,
  communityTone,
  date,
  userName,
  body,
  unread,
}: {
  community: string
  communityTone?: string
  /** Calendar date for earlier items. Recent rows leave this off. */
  date?: string
  userName?: string
  body: string
  unread: boolean
}) {
  return (
    <div className="flex items-start gap-3 py-4 pl-2">
      {unread ? (
        <Image
          src="/notifications/unread-dot.svg"
          alt=""
          width={16}
          height={16}
          className="mt-0.5 shrink-0"
        />
      ) : (
        <span className="mt-0.5 size-icon-md shrink-0" aria-hidden="true" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="flex min-w-0 items-center gap-1.5 text-description font-medium">
          {communityTone ? (
            <span
              className={cn(
                "inline-flex h-control-xs min-w-0 max-w-full items-center truncate rounded-md px-2 text-chip",
                communityTone
              )}
            >
              {community}
            </span>
          ) : (
            <span className="truncate">{community}</span>
          )}
          {date ? (
            <>
              <span aria-hidden="true">∙</span>
              <span className="shrink-0">{date}</span>
            </>
          ) : null}
        </p>
        <div className="flex flex-col gap-1">
          <p className="text-body-reading font-medium text-foreground">
            {userName ?? body}
          </p>
          {userName ? <p className="text-description">{body}</p> : null}
        </div>
      </div>
    </div>
  )
}
