import { formatUsd } from '@/lib/gtm/pricing'
import { cn } from '@/lib/utils'

export function Price({ amount, className }: { amount: number; className?: string }) {
  return (
    <span className={cn('tabular-nums', className)}>
      <span className="text-label">{formatUsd(amount)}</span>
      <span className="text-meta">/mo</span>
    </span>
  )
}
