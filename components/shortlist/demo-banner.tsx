import { StatusBanner } from '@/components/ui/status-banner'

/** Persistent demo-mode signal — preferred over tooltip-only badges. */
export function DemoBanner({ className }: { className?: string }) {
  return (
    <StatusBanner
      tone="info"
      title="Demo output"
      description="AI Gateway isn’t available on this team yet, so results are templated from your inputs."
      className={className}
    />
  )
}
