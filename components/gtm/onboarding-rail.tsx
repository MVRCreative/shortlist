import { Check } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { BrandMark } from '@/components/gtm/brand-mark'
import type { Step } from '@/components/gtm/app-header'
import { cn } from '@/lib/utils'

const ONBOARDING_STEPS: { step: Step; title: string; description: string }[] = [
  { step: 'Profile', title: 'Your company', description: 'What you sell and to whom' },
  { step: 'Enrich', title: 'Review profile', description: 'AI-built ICP and positioning' },
  { step: 'Match', title: 'Calibrate accounts', description: 'Mark fits and misses' },
  { step: 'Turn on', title: 'Turn on pipeline', description: 'Cadence, volume, content' },
]

export function OnboardingRail({
  step,
  isDemo,
  canVisit,
  onSelect,
}: {
  step: Step
  isDemo: boolean
  canVisit: (step: Step) => boolean
  onSelect: (step: Step) => void
}) {
  const currentIndex = ONBOARDING_STEPS.findIndex((s) => s.step === step)

  return (
    <div className="flex h-full flex-col gap-10 py-6">
      <BrandMark isDemo={isDemo} />
      <nav aria-label="Setup steps" className="flex-1">
        <ol className="flex flex-col">
          {ONBOARDING_STEPS.map((item, index) => {
            const isCurrent = index === currentIndex
            const isDone = index < currentIndex
            const enabled = !isCurrent && canVisit(item.step)
            return (
              <li key={item.step} className="relative flex">
                {index < ONBOARDING_STEPS.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className={cn('absolute top-9 bottom-0 left-[1.4375rem] w-px', isDone ? 'bg-foreground' : 'bg-border')}
                  />
                ) : null}
                <button
                  type="button"
                  disabled={!enabled}
                  aria-current={isCurrent ? 'step' : undefined}
                  onClick={() => onSelect(item.step)}
                  className="flex w-full gap-3 rounded-lg p-2 pb-5 text-left transition-colors enabled:hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className={cn(
                      'relative flex size-7 shrink-0 items-center justify-center rounded-full border text-chip tabular',
                      isDone && 'border-foreground bg-foreground text-background',
                      isCurrent && 'border-foreground bg-background text-foreground',
                      !isDone && !isCurrent && 'border-border bg-background text-muted-foreground',
                    )}
                  >
                    {isDone ? <Check className="size-icon-xs" aria-hidden="true" /> : index + 1}
                  </span>
                  <span className="flex flex-col gap-0.5 pt-0.5">
                    <span className={cn('text-label', !isCurrent && !isDone && 'text-muted-foreground')}>
                      {item.title}
                    </span>
                    <span className="text-meta">{item.description}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>
      <div className="flex items-center justify-between">
        <p className="text-meta">Setup takes about 3 minutes</p>
        <ThemeToggle />
      </div>
    </div>
  )
}
