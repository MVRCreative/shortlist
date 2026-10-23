import { FileText, RefreshCw, Settings2, UserRound, Users, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { BrandMark } from '@/components/gtm/brand-mark'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  icon: LucideIcon
  onSelect: () => void
  active?: boolean
  count?: string
}

function NavButton({ item, compact = false }: { item: NavItem; compact?: boolean }) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={item.onSelect}
      aria-current={item.active ? 'page' : undefined}
      aria-label={compact ? item.label : undefined}
      className={cn(
        'flex items-center gap-4 rounded-full text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        compact ? 'size-control-md justify-center' : 'w-full px-4 py-3',
        item.active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className={cn('size-5 shrink-0', item.active && 'stroke-[2.5]')} aria-hidden="true" />
      {compact ? null : (
        <>
          <span className={cn('flex-1 text-section-title', !item.active && 'font-normal')}>{item.label}</span>
          {item.count ? <span className="text-meta tabular">{item.count}</span> : null}
        </>
      )}
    </button>
  )
}

export function DashboardNav({
  isDemo,
  companyName,
  website,
  leadsProgress,
  pending,
  onLeads,
  onContent,
  onProfile,
  onSettings,
  onNextWeek,
}: {
  isDemo: boolean
  companyName: string
  website: string
  leadsProgress: string
  pending: boolean
  onLeads: () => void
  onContent: () => void
  onProfile: () => void
  onSettings: () => void
  onNextWeek: () => void
}) {
  const items: NavItem[] = [
    { label: 'Leads', icon: Users, onSelect: onLeads, active: true, count: leadsProgress },
    { label: 'Content', icon: FileText, onSelect: onContent },
    { label: 'Profile', icon: UserRound, onSelect: onProfile },
    { label: 'Settings', icon: Settings2, onSelect: onSettings },
  ]

  return (
    <>
      <div className="flex items-center justify-between gap-2 py-4 lg:hidden">
        <BrandMark isDemo={isDemo} />
        <nav aria-label="Dashboard" className="flex items-center gap-1">
          {items.slice(1).map((item) => (
            <NavButton key={item.label} item={item} compact />
          ))}
          <ThemeToggle />
          <Button size="icon-sm" aria-label="Preview next week" onClick={onNextWeek} pending={pending}>
            {pending ? null : <RefreshCw />}
          </Button>
        </nav>
      </div>

      <div className="hidden h-full flex-col gap-8 py-6 lg:flex">
        <div className="px-4">
          <BrandMark isDemo={isDemo} />
        </div>
        <nav aria-label="Dashboard" className="flex flex-col gap-1">
          {items.map((item) => (
            <NavButton key={item.label} item={item} />
          ))}
        </nav>
        <Button size="lg" shape="pill" className="w-full" onClick={onNextWeek} pending={pending}>
          {pending ? null : <RefreshCw />}
          Preview next week
        </Button>
        <div className="mt-auto flex items-center gap-3 rounded-full px-2 py-2">
          <span className="flex size-control-sm shrink-0 items-center justify-center rounded-full bg-muted text-label">
            {companyName.charAt(0).toUpperCase()}
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-label">{companyName}</span>
            {website ? <span className="truncate text-meta">{website}</span> : null}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </>
  )
}
