import { BrandMark } from '@/components/shortlist/brand-mark'
import { ThemeToggle } from '@/components/theme-toggle'
import { STEPS, type Step } from '@/lib/shortlist/steps'

const ONBOARDING = STEPS.filter((s) => s !== 'Digest')

export function AppHeader({ step, isDemo }: { step: Step; isDemo: boolean }) {
  const index = ONBOARDING.indexOf(step as (typeof ONBOARDING)[number])
  const n = String(Math.max(index, 0) + 1).padStart(2, '0')
  const label = step === 'Campaign' ? 'Campaign' : step

  return (
    <header className="flex items-center justify-between gap-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-2">
      <BrandMark isDemo={isDemo} />
      <div className="flex items-center gap-3">
        {step !== 'Digest' ? (
          <p className="kicker">
            {n} <span aria-hidden="true">|</span> <span className="kicker-strong">{label}</span>
          </p>
        ) : (
          <span className="kicker">Live</span>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}
