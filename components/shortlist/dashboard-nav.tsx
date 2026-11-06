'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { BrandMark } from '@/components/shortlist/brand-mark'
import { cn, initialOf } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Digest', href: '/digest' },
  { label: 'Audience', href: '/audience' },
  { label: 'Campaigns', href: '/campaigns' },
  { label: 'Profile', href: '/profile' },
  { label: 'Plan', href: '/plan' },
] as const

const MOBILE_MENU_ID = 'dashboard-mobile-menu'

export function DashboardNav({
  isDemo,
  companyName,
  website,
  onSignOut,
}: {
  isDemo: boolean
  companyName: string
  website: string
  onSignOut: () => void
}) {
  const pathname = usePathname()
  // Tracking the path the menu was opened on closes it on navigation without an effect.
  const [openOnPath, setOpenOnPath] = useState<string | null>(null)
  const open = openOnPath === pathname

  const links = (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} {...item} active={pathname === item.href} />
      ))}
    </nav>
  )

  const footer = (
    <div className="flex items-center justify-between gap-2 border-t border-stroke-soft-200 pt-3">
      <button
        type="button"
        onClick={onSignOut}
        className="-mx-2 rounded-lg px-2 py-1.5 text-paragraph-xs text-text-soft-400 transition-colors duration-150 ease-out focus-ring fine-hover:hover:text-text-strong-950"
      >
        Sign out
      </button>
      <ThemeToggle />
    </div>
  )

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 sm:px-6 lg:hidden">
        <BrandMark isDemo={isDemo} />
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls={MOBILE_MENU_ID}
          onClick={() => setOpenOnPath(open ? null : pathname)}
          className="-mr-2 flex size-11 items-center justify-center rounded-lg focus-ring"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-bg-strong-950 text-label-xs font-medium text-static-white">
            {initialOf(companyName)}
          </span>
        </button>
      </div>

      {open ? (
        <div id={MOBILE_MENU_ID} className="flex flex-col gap-3 border-b border-stroke-soft-200 px-4 pb-4 sm:px-6 lg:hidden">
          <CompanyCard companyName={companyName} website={website} />
          {links}
          {footer}
        </div>
      ) : null}

      <div className="hidden min-h-dvh flex-col px-4 pt-8 pb-6 lg:flex">
        <BrandMark isDemo={isDemo} />
        <div className="mt-8 flex flex-1 flex-col gap-6">
          <CompanyCard companyName={companyName} website={website} />
          {links}
        </div>
        {footer}
      </div>
    </>
  )
}

function CompanyCard({ companyName, website }: { companyName: string; website: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-bg-strong-950 text-label-xs font-medium text-static-white">
        {initialOf(companyName)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-paragraph-xs font-medium text-text-strong-950">{companyName}</span>
        {website ? <span className="truncate text-paragraph-xs text-text-sub-600">{website}</span> : null}
      </div>
    </div>
  )
}

function NavLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        '-mx-2 rounded-lg px-2 py-1.5 text-paragraph-xs transition-colors duration-150 ease-out focus-ring',
        active
          ? 'bg-bg-weak-50 font-medium text-text-strong-950'
          : 'text-text-sub-600 fine-hover:hover:text-text-strong-950',
      )}
    >
      {label}
    </Link>
  )
}
