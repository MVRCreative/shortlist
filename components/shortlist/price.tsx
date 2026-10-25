import { formatUsd } from '@/lib/shortlist/pricing'
import { cn } from '@/lib/utils'

export function Price({ amount, className }: { amount: number; className?: string }) {
  return (
    <span className={cn('tabular-nums', className)}>
      <span className="text-label-sm">{formatUsd(amount)}</span>
      <span className="text-paragraph-xs">/mo</span>
    </span>
  )
}
