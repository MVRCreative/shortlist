import { ArrowLeft, ArrowRight, Check, Webhook, X, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StepHeading } from '@/components/gtm/step-heading'
import { cn } from '@/lib/utils'
import type { SampleAccount, Verdict } from '@/lib/gtm/schemas'

const MIN_REVIEWED = 5

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function AccountRow({
  account,
  verdict,
  onVerdict,
}: {
  account: SampleAccount
  verdict?: Verdict
  onVerdict: (verdict: Verdict | undefined) => void
}) {
  const toggle = (next: Verdict) => onVerdict(verdict === next ? undefined : next)

  return (
    <li
      className={cn(
        'flex flex-col gap-3 px-5 py-4 transition-opacity duration-base sm:flex-row sm:items-start sm:gap-4',
        verdict === 'nofit' && 'opacity-50',
      )}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <span
          aria-hidden="true"
          className="flex size-avatar-lg shrink-0 items-center justify-center rounded-lg bg-secondary text-chip text-secondary-foreground"
        >
          {initials(account.name)}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h3 className="text-label">{account.name}</h3>
            <span className="text-meta">{account.domain}</span>
          </div>
          <p className="text-meta">
            {account.industry} · {account.employees} · {account.location}
          </p>
          <p className="flex items-center gap-1.5 text-body text-status-warning-fg">
            <Zap className="size-icon-xs shrink-0" aria-hidden="true" />
            {account.signal}
          </p>
          <p className="text-description text-pretty">{account.fitReason}</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2 pl-13 sm:pl-0" role="group" aria-label={`Rate ${account.name}`}>
        <Button
          variant="outline"
          size="sm"
          aria-pressed={verdict === 'nofit'}
          onClick={() => toggle('nofit')}
          className={cn(verdict === 'nofit' && 'border-status-danger-bd bg-status-danger-bg text-status-danger-fg')}
        >
          <X />
          <span className="sr-only sm:not-sr-only">Not a fit</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          aria-pressed={verdict === 'fit'}
          onClick={() => toggle('fit')}
          className={cn(verdict === 'fit' && 'border-status-success-bd bg-status-success-bg text-status-success-fg')}
        >
          <Check />
          <span className="sr-only sm:not-sr-only">Fit</span>
        </Button>
      </div>
    </li>
  )
}

export function MatchStep({
  accounts,
  verdicts,
  onVerdict,
  onBack,
  onContinue,
}: {
  accounts: SampleAccount[]
  verdicts: Record<string, Verdict>
  onVerdict: (id: string, verdict: Verdict | undefined) => void
  onBack: () => void
  onContinue: () => void
}) {
  const reviewed = Object.keys(verdicts).length
  const fits = Object.values(verdicts).filter((v) => v === 'fit').length
  const canContinue = reviewed >= MIN_REVIEWED && fits > 0

  return (
    <div className="flex flex-col gap-8">
      <StepHeading
        eyebrow="Matchmaking"
        title="Good fit, or not?"
        description={`Rate at least ${MIN_REVIEWED} of these sample accounts. We use your picks to tune who shows up in your digest.`}
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-meta">
            <Webhook className="size-icon-xs" aria-hidden="true" />
            Returned from Clay
            <Badge variant="neutral">Simulated</Badge>
          </p>
          <p className="text-meta tabular" aria-live="polite">
            {reviewed}/{accounts.length} rated · {fits} fit
          </p>
        </div>
        <Card className="gap-0 py-0">
          <ul className="divide-y divide-border">
            {accounts.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                verdict={verdicts[account.id]}
                onVerdict={(verdict) => onVerdict(account.id, verdict)}
              />
            ))}
          </ul>
        </Card>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" tone="muted" onClick={onBack}>
          <ArrowLeft />
          Back to profile
        </Button>
        <Button size="lg" onClick={onContinue} disabled={!canContinue}>
          {canContinue ? 'Set up my digest' : `Rate ${Math.max(MIN_REVIEWED - reviewed, 0) || 1} more`}
          <ArrowRight />
        </Button>
      </div>
    </div>
  )
}
