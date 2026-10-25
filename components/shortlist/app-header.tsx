import { Progress } from '@/components/ui/progress'
import { BrandMark } from '@/components/shortlist/brand-mark'
import { ThemeToggle } from '@/components/theme-toggle'
import { STEPS, type Step } from '@/lib/shortlist/steps'

export function AppHeader({ step, isDemo }: { step: Step; isDemo: boolean }) {
  const index = STEPS.indexOf(step)
  const isLive = step === 'Digest'

  return (
    <header className="flex flex-col gap-4 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between gap-4">
        <BrandMark isDemo={isDemo} />
        <div className="flex items-center gap-3">
          <span className="text-paragraph-xs tabular-nums">
            {isLive
              ? 'Live'
              : `Step ${index + 1} of ${STEPS.length - 1} · ${step === 'Turn on' ? 'Turn on Shortlist' : step}`}
          </span>
          <ThemeToggle />
        </div>
      </div>
      <Progress
        value={isLive ? 100 : ((index + 1) / (STEPS.length - 1)) * 100}
        className="h-1"
        aria-label="Setup progress"
      />
    </header>
  )
}
