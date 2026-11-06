import type { ReactNode } from 'react'
import { DashboardNav } from '@/components/shortlist/dashboard-nav'
import { cn } from '@/lib/utils'

/**
 * One grid for every signed-in screen. Column count never changes with the
 * view, so the rail stays put; screens without a side panel span both columns.
 */
export function AppShell({
  isDemo,
  companyName,
  website,
  onSignOut,
  aside,
  children,
  mainClassName,
}: {
  isDemo: boolean
  companyName: string
  website: string
  onSignOut: () => void
  aside?: ReactNode
  children: ReactNode
  mainClassName?: string
}) {
  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-6xl lg:grid-cols-[12rem_minmax(0,1fr)] xl:grid-cols-[12rem_minmax(0,1fr)_18rem]">
      <aside className="lg:border-r lg:border-stroke-soft-200">
        <div className="lg:sticky lg:top-0 lg:max-h-dvh lg:overflow-y-auto">
          <DashboardNav isDemo={isDemo} companyName={companyName} website={website} onSignOut={onSignOut} />
        </div>
      </aside>

      <main className={cn('flex min-w-0 flex-col pb-20', !aside && 'xl:col-span-2', mainClassName)}>{children}</main>

      {aside ? (
        <aside className="hidden xl:block xl:border-l xl:border-stroke-soft-200">
          <div className="xl:sticky xl:top-0 xl:max-h-dvh xl:overflow-y-auto xl:pt-8 xl:pb-16">{aside}</div>
        </aside>
      ) : null}
    </div>
  )
}
