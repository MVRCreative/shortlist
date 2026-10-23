/**
 * Empty
 *
 * Purpose: the empty state for a region — icon, title, one-line description,
 * and at most one action. Copy names the next best step.
 *
 * Variants: `size` default (page region) | compact (inside a card or panel);
 * `frame` none | dashed. `FeedEmpty` is the dashed feed-column preset and
 * defaults `hatch` off (member empties). Admin `Empty` keeps hatch on.
 *
 * Accessibility: plain content; put the title in `EmptyTitle` so it reads as
 * the region heading.
 *
 * Usage: <Empty><EmptyHeader><EmptyTitle>No posts yet</EmptyTitle></EmptyHeader></Empty>
 */
import { cva, type VariantProps } from 'class-variance-authority'

import { iconMarkVariants } from '@/components/ui/icon-mark'
import { cn } from '@/lib/utils'

function Empty({
  className,
  hatch: showHatch = true,
  size = 'default',
  frame = 'none',
  ...props
}: React.ComponentProps<'div'> & {
  /** Faint diagonal fill. Off for failures — those are not empty regions. */
  hatch?: boolean
  /** `compact` for empties inside a card or panel; `default` for a page region. */
  size?: 'default' | 'compact'
  /** `dashed` marks a drop-in region with no surrounding card. */
  frame?: 'none' | 'dashed'
}) {
  return (
    <div
      data-slot="empty"
      data-size={size}
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl text-center text-balance',
        size === 'compact' ? 'gap-4 p-4 md:p-6' : 'gap-6 p-6 md:p-12',
        frame === 'dashed' && 'border border-dashed border-border',
        showHatch && 'hatch',
        className,
      )}
      {...props}
    />
  )
}

function EmptyHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-header"
      className={cn(
        'flex max-w-sm flex-col items-center gap-2 text-center',
        className,
      )}
      {...props}
    />
  )
}

const emptyMediaVariants = cva(
  'flex shrink-0 items-center justify-center mb-2 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: iconMarkVariants({ size: "lg" }),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function EmptyMedia({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  )
}

function EmptyTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-title"
      className={cn('text-section-title', className)}
      {...props}
    />
  )
}

function EmptyDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        'text-description [&>a]:text-link',
        className,
      )}
      {...props}
    />
  )
}

/** Empty region in a feed column. Same outer width and radius as a post — no extra margin. */
function FeedEmpty({ className, hatch = false, ...props }: React.ComponentProps<typeof Empty>) {
  return (
    <Empty frame="dashed" hatch={hatch} className={cn("w-full", className)} {...props} />
  )
}

function EmptyContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        'flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-balance',
        className,
      )}
      {...props}
    />
  )
}

export {
  Empty,
  FeedEmpty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
}
