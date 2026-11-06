'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { BrandMark } from '@/components/shortlist/brand-mark'
import { cn } from '@/lib/utils'

export type DigestMenu = 'none' | 'profile' | 'settings'

/**
 * Digest chrome: brand + account. Profile / Audience / Campaigns / Plan / Sign out
 * are plain text actions — not padded buttons competing with the digest.
 */
export function DashboardNav({
  isDemo,
  companyName,
  website,
  menu,
  onMenuChange,
  onSignOut,
}: {
  isDemo: boolean
  companyName: string
  website: string
  menu: DigestMenu
  onMenuChange: (menu: DigestMenu) => void
  onSignOut: () => void
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  function pick(next: DigestMenu) {
    onMenuChange(menu === next ? 'none' : next)
    setOpen(false)
  }

  const links = (
    <nav aria-label="Account" className="flex flex-col gap-1.5">
      <NavLink label="Digest" href="/digest" active={pathname === '/digest' && menu === 'none'} />
      <NavLink label="Audience" href="/audience" active={pathname === '/audience'} />
      <NavLink label="Campaigns" href="/campaigns" active={pathname === '/campaigns'} />
      <NavButton label="Profile" active={menu === 'profile'} onSelect={() => pick('profile')} />
      <NavButton label="Plan" active={menu === 'settings'} onSelect={() => pick('settings')} />
      <NavButton label="Sign out" onSelect={onSignOut} />
    </nav>
  )

  return (
    <>
      <div className="flex items-center justify-between gap-2 py-4 pt-[max(1rem,env(safe-area-inset-top))] lg:hidden">
        <BrandMark isDemo={isDemo} />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Account"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex size-7 items-center justify-center rounded-md bg-bg-strong-950 text-label-xs font-medium text-static-white focus-ring"
          >
            {companyName.charAt(0).toUpperCase()}
          </button>
        </div>
      </div>

      {open ? (
        <div className="mb-4 border-b border-stroke-soft-200 pb-4 lg:hidden">{links}</div>
      ) : null}

      <div className="hidden flex-col px-4 pt-8 pb-10 lg:flex">
        <BrandMark isDemo={isDemo} />
        <div className="mt-8 flex flex-col gap-4">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-bg-strong-950 text-label-xs font-medium text-static-white">
              {companyName.charAt(0).toUpperCase()}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-paragraph-xs font-medium text-text-strong-950">{companyName}</span>
              {website ? <span className="truncate text-paragraph-xs text-text-sub-600">{website}</span> : null}
            </div>
            <ThemeToggle />
          </div>
          {links}
        </div>
      </div>
    </>
  )
}

function NavLink({
  label,
  href,
  active,
}: {
  label: string
  href: string
  active?: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'w-fit text-left text-paragraph-xs transition-colors duration-150 focus-ring',
        active ? 'text-text-strong-950' : 'text-text-sub-600 fine-hover:text-text-strong-950',
      )}
    >
      {label}
    </Link>
  )
}

function NavButton({
  label,
  active,
  onSelect,
}: {
  label: string
  active?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'w-fit text-left text-paragraph-xs transition-colors duration-150 focus-ring',
        active ? 'text-text-strong-950' : 'text-text-sub-600 fine-hover:text-text-strong-950',
      )}
    >
      {label}
    </button>
  )
}
