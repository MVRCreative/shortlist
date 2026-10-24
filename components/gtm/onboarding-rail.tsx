import { Check } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { BrandMark } from '@/components/gtm/brand-mark'
import type { Step } from '@/components/gtm/app-header'
import { cn } from '@/lib/utils'

const ONBOARDING_STEPS: { step: Step; title: string; description: string }[] = [
  { step: 'Profile', title: 'Your profile', description: 'What you do, for whom' },
  { step: 'Match', title: 'Calibrate accounts', description: 'Mark fits and misses' },
  { step: 'Turn on', title: 'Turn on Shortlist', description: 'Pick a plan' },
]

function StepMarker({ index, state }: { index: number; state: 'done' | 'current' | 'upcoming' }) {
  if (state === 'done') {
    return (
      <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-background">
        <Check className="size-3" strokeWidth={3} aria-hidden="true" />
      </span>
    )
  }
  return (
    <span
      className={cn(
        'flex size-7 items-center justify-center rounded-full text-chip tabular-nums',
        state === 'current'
          ? 'bg-primary font-semibold text-primary-foreground shadow-xs'
          : 'border border-border bg-background text-muted-foreground',
      )}
    >
      {index + 1}
    </span>
  )
}

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
      <nav aria-label="Setup steps" className="flex flex-1 flex-col gap-4">
        <ol className="flex flex-col">
          {ONBOARDING_STEPS.map((item, index) => {
            const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming'
            const enabled = state !== 'current' && canVisit(item.step)
            return (
              <li key={item.step} className="relative flex">
                {index < ONBOARDING_STEPS.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute top-9 bottom-0 left-[calc(1.375rem-0.5px)] w-px',
                      state === 'done' ? 'bg-foreground/40' : 'bg-border',
                    )}
                  />
                ) : null}
                <button
                  type="button"
                  disabled={!enabled}
                  aria-current={state === 'current' ? 'step' : undefined}
                  onClick={() => onSelect(item.step)}
                  className="flex w-full gap-3 rounded-lg p-2 pb-5 text-left transition-colors duration-150 ease-out enabled:hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                    <StepMarker index={index} state={state} />
                  </span>
                  <span className="flex flex-col gap-0.5 pt-0.5">
                    <span
                      className={cn(
                        'text-label',
                        state === 'current' ? 'font-semibold text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {state === 'done' ? <span className="sr-only">Completed: </span> : null}
                      {item.title}
                    </span>
                    <span className="text-meta">{item.description}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
        <p className="px-2 text-meta">Setup takes about 3 minutes</p>
      </nav>
      <div className="flex">
        <ThemeToggle />
      </div>
    </div>
  )
}
