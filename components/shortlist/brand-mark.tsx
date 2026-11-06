import Link from 'next/link'

export function BrandMark({ isDemo, href = '/digest' }: { isDemo?: boolean; href?: string }) {
  return (
    <Link
      href={href}
      className="flex items-baseline gap-2 focus-ring"
      aria-label={href === '/' ? 'Shortlist home' : 'Shortlist, go to digest'}
    >
      <span className="text-label-sm font-normal tracking-tight text-text-strong-950">Shortlist</span>
      {isDemo ? <span className="kicker">Demo</span> : null}
    </Link>
  )
}
