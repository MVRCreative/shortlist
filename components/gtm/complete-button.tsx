import { Check, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function CompleteButton({
  done,
  onToggle,
  label,
}: {
  done: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      shape="pill"
      aria-pressed={done}
      aria-label={`${done ? 'Mark not completed' : 'Mark completed'}: ${label}`}
      onClick={onToggle}
      className={cn(
        'shrink-0 self-start',
        done
          ? 'border-status-success-bd bg-status-success-bg text-status-success-fg hover:bg-status-success-bg hover:text-status-success-fg'
          : 'text-muted-foreground',
      )}
    >
      {done ? <Check /> : <Circle />}
      {done ? 'Completed' : 'Mark completed'}
    </Button>
  )
}
