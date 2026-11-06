import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
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
    <div className="flex h-full flex-col gap-8 py-6 font-[family-name:var(--font-geist)]">
      <BrandMark isDemo={isDemo} />
      <nav aria-label="Setup steps" className="flex flex-1 flex-col gap-6">
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
                <span className="flex min-w-0 flex-col gap-1">
                  <span
                    className={cn(
                      'text-label-sm leading-tight tracking-tight',
                      state === 'active' ? 'text-text-strong-950' : 'text-text-sub-600',
                    )}
                  >
                    {state === 'completed' ? <span className="sr-only">Completed: </span> : null}
                    {item.title}
                  </span>
                  <span className="text-paragraph-xs leading-snug text-text-soft-400">
                    {item.description}
                  </span>
                </span>
              </VerticalStepper.Item>
            )
          })}
        </VerticalStepper.Root>
        <p className="px-2 text-paragraph-xs text-text-soft-400">About 3 minutes</p>
      </nav>
      <div className="flex flex-col items-start gap-4">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-label-sm text-text-sub-600 transition-colors focus-ring fine-hover:hover:text-text-strong-950"
        >
          Exit setup
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
        <ThemeToggle />
      </div>
    </div>
  )
}
