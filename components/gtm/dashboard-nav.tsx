import { FileText, LogOut, Settings2, UserRound, Users, type LucideIcon } from 'lucide-react'
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
        'flex items-center gap-2.5 rounded-md text-left transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        compact ? 'size-control-sm justify-center' : 'h-control-sm w-full px-2',
        item.active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {compact ? null : (
        <>
          <span className="flex-1 text-meta font-medium text-current">{item.label}</span>
          {item.count ? <span className="text-meta tabular-nums">{item.count}</span> : null}
        </>
      )}
    </button>
  )
}

export function DashboardNav({
  isDemo,
  companyName,
  website,
  accountsProgress,
  onAccounts,
  onContent,
  onProfile,
  onSettings,
  onSignOut,
}: {
  isDemo: boolean
  companyName: string
  website: string
  accountsProgress: string
  onAccounts: () => void
  onContent: () => void
  onProfile: () => void
  onSettings: () => void
  onSignOut: () => void
}) {
  const items: NavItem[] = [
    { label: 'Accounts', icon: Users, onSelect: onAccounts, active: true, count: accountsProgress },
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
        </nav>
      </div>

      <div className="hidden h-full flex-col gap-6 py-6 lg:flex">
        <div className="px-2">
          <BrandMark isDemo={isDemo} />
        </div>
        <nav aria-label="Dashboard" className="flex flex-col gap-0.5">
          {items.map((item) => (
            <NavButton key={item.label} item={item} />
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2.5 px-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-chip font-medium">
            {companyName.charAt(0).toUpperCase()}
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-meta font-medium text-foreground">{companyName}</span>
            {website ? <span className="truncate text-meta">{website}</span> : null}
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="icon-xs" tone="muted" aria-label="Sign out" onClick={onSignOut}>
            <LogOut />
          </Button>
        </div>
      </div>
    </>
  )
}
