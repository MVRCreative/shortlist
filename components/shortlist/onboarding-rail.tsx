import * as VerticalStepper from '@/components/alignui/vertical-stepper'
import { ThemeToggle } from '@/components/theme-toggle'
import { BrandMark } from '@/components/shortlist/brand-mark'
import type { Step } from '@/lib/shortlist/steps'
import { cn } from '@/lib/utils'

const ONBOARDING_STEPS: { step: Step; title: string; description: string }[] = [
  { step: 'Profile', title: 'Your profile', description: 'Company, website, plan' },
  { step: 'Audience', title: 'Your audience', description: 'Who to reach, and approve examples' },
  { step: 'Campaign', title: 'Campaign', description: 'Optional outreach purpose' },
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
    <div className="flex h-full flex-col gap-8 py-6">
      <BrandMark isDemo={isDemo} />
      <nav aria-label="Setup steps" className="flex flex-1 flex-col gap-4">
        <VerticalStepper.Root>
          {ONBOARDING_STEPS.map((item, index) => {
            const state =
              index < currentIndex ? 'completed' : index === currentIndex ? 'active' : 'default'
            const enabled = state !== 'active' && canVisit(item.step)
            return (
              <VerticalStepper.Item
                key={item.step}
                state={state}
                disabled={!enabled}
                aria-current={state === 'active' ? 'step' : undefined}
                onClick={() => {
                  if (enabled) onSelect(item.step)
                }}
                className={cn(!enabled && state !== 'active' && 'cursor-default')}
              >
                <VerticalStepper.ItemIndicator>
                  {state === 'completed' ? null : index + 1}
                </VerticalStepper.ItemIndicator>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span
                    className={cn(
                      'text-label-sm',
                      state === 'active' ? 'text-text-strong-950' : 'text-text-sub-600',
                    )}
                  >
                    {state === 'completed' ? <span className="sr-only">Completed: </span> : null}
                    {item.title}
                  </span>
                  <span className="text-paragraph-xs text-text-sub-600">{item.description}</span>
                </span>
              </VerticalStepper.Item>
            )
          })}
        </VerticalStepper.Root>
        <p className="px-2 text-paragraph-xs text-text-sub-600">Setup takes about 3 minutes</p>
      </nav>
      <div className="flex">
        <ThemeToggle />
      </div>
    </div>
  )
}
