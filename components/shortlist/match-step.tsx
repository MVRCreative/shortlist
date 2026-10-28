import { RiArrowLeftLine, RiArrowRightLine, RiCheckLine, RiCloseLine } from '@remixicon/react'
import * as Button from '@/components/alignui/button'
import { StepHeading } from '@/components/shortlist/step-heading'
import { cn } from '@/lib/utils'
import type { SampleAccount, Verdict } from '@/lib/shortlist/schemas'

const RECOMMENDED_REVIEWED = 5

function facts(account: SampleAccount) {
  return [account.industry, account.employees, account.location, account.signal].filter(
    (item) => item && !item.endsWith('not listed'),
  )
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
  const detail = facts(account)
  const description = account.fitReason.startsWith('Similar to') ? '' : account.fitReason

  return (
    <li
      className={cn(
        'flex flex-col gap-3 px-4 py-3 transition-opacity duration-200 ease-out sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:px-5',
        verdict === 'nofit' && 'opacity-50',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <a
          href={`https://${account.domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex max-w-full flex-wrap items-baseline gap-x-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base"
        >
          <span className="text-label-sm text-text-strong-950">{account.name}</span>
          <span className="text-paragraph-xs text-text-soft-400 underline decoration-current/30 underline-offset-2 fine-hover:group-hover:decoration-current">
            {account.domain}
            <span className="sr-only"> (opens in a new tab)</span>
          </span>
        </a>
        {detail.length > 0 ? (
          <p className="text-paragraph-xs text-text-sub-600">{detail.join(' · ')}</p>
        ) : null}
        {description ? (
          <p className="line-clamp-2 text-paragraph-sm text-pretty text-text-sub-600">{description}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-1" role="group" aria-label={`Rate ${account.name}`}>
        <Button.Root
          variant="neutral"
          mode="ghost"
          size="xsmall"
          aria-label={`Not a fit: ${account.name}`}
          aria-pressed={verdict === 'nofit'}
          onClick={() => toggle('nofit')}
          className={cn(
            'size-8 px-0',
            verdict === 'fit' && 'text-text-disabled-300 fine-hover:bg-transparent',
            verdict === 'nofit' && 'bg-bg-weak-50 text-text-strong-950',
            !verdict && 'text-text-soft-400',
          )}
        >
          <Button.Icon as={RiCloseLine} />
        </Button.Root>
        <Button.Root
          variant="neutral"
          mode="ghost"
          size="xsmall"
          aria-label={`Fit: ${account.name}`}
          aria-pressed={verdict === 'fit'}
          onClick={() => toggle('fit')}
          className={cn(
            'size-8 px-0',
            verdict === 'fit'
              ? 'bg-success-base text-static-white fine-hover:bg-green-700'
              : 'text-success-base',
          )}
        >
          <Button.Icon as={RiCheckLine} />
        </Button.Root>
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
  const canContinue = fits > 0

  return (
    <div className="flex flex-col gap-6">
      <StepHeading
        eyebrow="Matchmaking"
        title="Good fit, or not?"
        description={`These companies come from one Ocean search of your example clients, size, and region. Mark at least one as a fit. Rating ${RECOMMENDED_REVIEWED} or more helps us tune who shows up next.`}
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="kicker">Ocean</p>
          <p className="text-paragraph-xs tabular-nums text-text-sub-600" aria-live="polite">
            {reviewed}/{accounts.length} rated · {fits} fit
          </p>
        </div>
        {accounts.length < 10 ? (
          <p className="text-paragraph-sm text-text-sub-600">
            Ocean returned {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} for this profile.
          </p>
        ) : null}

        <div className="surface-group">
          <ul className="divide-y divide-stroke-soft-200">
            {accounts.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                verdict={verdicts[account.id]}
                onVerdict={(verdict) => onVerdict(account.id, verdict)}
              />
            ))}
          </ul>
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t border-stroke-soft-200 bg-bg-weak-50/90 px-4 py-4 backdrop-blur sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Button.Root variant="neutral" mode="ghost" size="medium" onClick={onBack}>
          <Button.Icon as={RiArrowLeftLine} />
          Back to profile
        </Button.Root>
        <Button.Root size="medium" onClick={onContinue} disabled={!canContinue}>
          {canContinue ? 'Set up my digest' : 'Mark one as a fit'}
          <Button.Icon as={RiArrowRightLine} />
        </Button.Root>
      </div>
    </div>
  )
}
