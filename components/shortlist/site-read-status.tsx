import { CircleCheck, LoaderCircle } from 'lucide-react'

type Counts = { services: number; industries: number; buyers: number }

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`
}

export function SiteReadStatus({
  state,
  domain,
  error,
  counts,
}: {
  state: 'idle' | 'invalid' | 'reading' | 'done' | 'error'
  domain: string | null
  error: string | null
  counts: Counts
}) {
  if (state === 'invalid') {
    return <p className="text-paragraph-xs text-error-base">Enter your website, like yourstudio.com</p>
  }
  if (state === 'error') {
    return <p className="text-paragraph-xs text-error-base">{error}</p>
  }
  if (state === 'idle') {
    return <p className="text-paragraph-xs">Add your website and name, and we’ll fill in the rest from your site.</p>
  }

  if (state === 'reading') {
    return (
      <div className="flex gap-3 rounded-xl border border-stroke-soft-200 bg-bg-weak-50 p-3">
        <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin text-primary-base" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex flex-col gap-0.5">
            <p className="text-label-sm text-text-strong-950">Reading {domain}</p>
            <p className="text-paragraph-xs">Pulling your services, industries, and the people who hire you.</p>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {['w-20', 'w-24', 'w-16'].map((width) => (
              <span key={width} className={`h-6 ${width} animate-pulse rounded-full bg-bg-soft-200`} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const found = [
    plural(counts.services, 'service', 'services'),
    plural(counts.industries, 'industry', 'industries'),
    plural(counts.buyers, 'buyer title', 'buyer titles'),
  ]

  return (
    <div className="flex gap-3 rounded-xl border border-stroke-soft-200 bg-bg-weak-50 p-3">
      <CircleCheck className="mt-0.5 size-4 shrink-0 text-success-base" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        <p className="text-label-sm text-text-strong-950">Read {domain}</p>
        <p className="text-paragraph-xs text-pretty">
          Found {found.slice(0, 2).join(', ')} and {found[2]}. Turn off anything that doesn’t fit.
        </p>
      </div>
    </div>
  )
}
