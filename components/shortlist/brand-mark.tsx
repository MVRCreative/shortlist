import Link from 'next/link'

export function BrandMark({ isDemo }: { isDemo?: boolean }) {
  return (
    <Link
      href="/digest"
      className="flex items-baseline gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base"
      aria-label="Shortlist — go to digest"
    >
      <span className="text-label-sm font-normal tracking-tight text-text-strong-950">Shortlist</span>
      {isDemo ? <span className="kicker">Demo</span> : null}
    </Link>
  )
}
