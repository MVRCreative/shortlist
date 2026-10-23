/**
 * Skeleton
 *
 * Purpose: a placeholder with the shape of the content it stands in for.
 * Muted fill with the shared shimmer; `rounded-md` by default. Match the
 * radius of the real element (`rounded-xl` for a card, `rounded-full` for a
 * pill) so the swap does not change shape. Reduced motion stops the shimmer.
 */
import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="skeleton" className={cn('shimmer rounded-md bg-muted', className)} {...props} />
}

export { Skeleton }
