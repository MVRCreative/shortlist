import Link from 'next/link'

export function BrandMark({ isDemo }: { isDemo?: boolean }) {
  return (
    <Link
      href="/digest"
      className="flex items-baseline gap-2 focus-ring"
      aria-label="Shortlist — go to digest"
    >
      <span className="text-label-sm font-normal tracking-tight text-text-strong-950">Shortlist</span>
      {isDemo ? <span className="kicker">Demo</span> : null}
    </Link>
  )
}
