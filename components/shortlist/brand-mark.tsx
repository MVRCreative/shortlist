import Link from 'next/link'
import { Crosshair } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function BrandMark({ isDemo }: { isDemo?: boolean }) {
  return (
    <Link
      href="/digest"
      className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base"
      aria-label="Shortlist — go to digest"
    >
      <span className="flex size-8 items-center justify-center rounded-10 bg-bg-strong-950 text-static-white">
        <Crosshair className="size-4" aria-hidden="true" />
      </span>
      <span className="text-label-sm">Shortlist</span>
      {isDemo ? (
        <Badge variant="neutral" tabIndex={-1}>
          Demo
        </Badge>
      ) : null}
    </Link>
  )
}
