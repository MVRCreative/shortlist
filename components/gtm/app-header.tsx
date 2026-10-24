import { Crosshair } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ThemeToggle } from '@/components/theme-toggle'

export const STEPS = ['Profile', 'Match', 'Turn on', 'Digest'] as const
export type Step = (typeof STEPS)[number]

export function AppHeader({ step, isDemo }: { step: Step; isDemo: boolean }) {
  const index = STEPS.indexOf(step)
  const isLive = step === 'Digest'

  return (
    <header className="flex flex-col gap-4 pt-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex size-control-sm items-center justify-center rounded-lg bg-foreground text-background">
            <Crosshair className="size-icon-sm" aria-hidden="true" />
          </span>
          <span className="text-label">Shortlist</span>
          {isDemo ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="neutral" tabIndex={0}>
                  Demo output
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-60">
                AI Gateway isn’t available on this team yet, so results are templated from your inputs.
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-meta tabular-nums">
            {isLive ? 'Live' : `Step ${index + 1} of ${STEPS.length - 1} · ${step === 'Turn on' ? 'Turn on Shortlist' : step}`}
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
