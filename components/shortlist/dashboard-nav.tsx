'use client'

import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { BrandMark } from '@/components/shortlist/brand-mark'
import { cn } from '@/lib/utils'

export type DigestMenu = 'none' | 'profile' | 'settings'

/**
 * Digest chrome: brand + account. Profile / Plan / Sign out are plain text
 * actions — not padded buttons competing with the digest.
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

  function pick(next: DigestMenu) {
    onMenuChange(menu === next ? 'none' : next)
    setOpen(false)
  }

  const links = (
    <nav aria-label="Account" className="flex flex-col gap-1.5">
      <NavLink label="Profile" active={menu === 'profile'} onSelect={() => pick('profile')} />
      <NavLink label="Plan" active={menu === 'settings'} onSelect={() => pick('settings')} />
      <NavLink label="Sign out" onSelect={onSignOut} />
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
            className="flex size-7 items-center justify-center rounded-md bg-bg-strong-950 text-label-xs font-medium text-static-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base"
          >
            {companyName.charAt(0).toUpperCase()}
          </button>
        </div>
      </div>

      {open ? (
        <div className="mb-4 border-b border-stroke-soft-200 pb-4 lg:hidden">{links}</div>
      ) : null}

      <div className="hidden h-full flex-col py-6 lg:flex">
        <div className="px-1">
          <BrandMark isDemo={isDemo} />
        </div>

        <div className="mt-auto flex flex-col gap-4 px-1 pb-2">
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
        'w-fit text-left text-paragraph-xs transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base',
        active ? 'text-text-strong-950' : 'text-text-sub-600 fine-hover:text-text-strong-950',
      )}
    >
      {label}
    </button>
  )
}
