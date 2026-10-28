import { formatUsd } from '@/lib/shortlist/pricing'
import { cn } from '@/lib/utils'

export function Price({ amount, className }: { amount: number; className?: string }) {
  return (
    <span className={cn('tabular-nums', className)}>
      <span className="text-xl font-normal tracking-tight text-text-strong-950">{formatUsd(amount)}</span>
      <span className="text-paragraph-xs text-text-sub-600">/mo</span>
    </span>
  )
}
