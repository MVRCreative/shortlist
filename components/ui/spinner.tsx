/**
 * Spinner
 *
 * Purpose: in-flight indicator inside a control or next to inline text. Never
 * a full-screen loader; data regions use layout-matched skeletons. Buttons use
 * `<Button pending>` instead of placing a Spinner by hand.
 *
 * Accessibility: announces "Loading" as a status unless the caller hides it
 * (Button does, and sets `aria-busy` on itself).
 */
import { Loader2Icon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn('size-5 animate-spin', className)}
      {...props}
    />
  )
}

export { Spinner }
