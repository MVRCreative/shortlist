import { Crosshair } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function BrandMark({ isDemo }: { isDemo: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-control-sm items-center justify-center rounded-lg bg-foreground text-background">
        <Crosshair className="size-icon-sm" aria-hidden="true" />
      </span>
      <span className="text-label">Shortlist</span>
      {isDemo ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="neutral" tabIndex={0}>
              Demo
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-60">
            AI Gateway isn’t available on this team yet, so results are templated from your inputs.
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}
