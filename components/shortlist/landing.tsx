import Link from 'next/link'
import { BrandMark } from '@/components/shortlist/brand-mark'
import { LandingRolodex } from '@/components/shortlist/landing-rolodex'
import { ThemeToggle } from '@/components/theme-toggle'

const BEATS = [
  { n: '01', label: 'Who', body: 'Ten accounts that look like your best clients.' },
  { n: '02', label: 'Why', body: 'A real signal. Not a scraped email list.' },
  { n: '03', label: 'What', body: 'The angle. The note. You hit send.' },
] as const

export function Landing({
  continueSlot,
  continueHref,
}: {
  continueSlot?: React.ReactNode
  continueHref?: string
}) {
  const ctaHref = continueHref ?? '/onboarding/profile'
  const ctaLabel = continueHref ? 'Continue' : 'Paste your site'

  return (
    <div className="relative min-h-dvh bg-bg-weak-50 text-text-strong-950">
      <header className="landing-enter relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <BrandMark href="/" />
        <div className="flex items-center gap-3">
          {continueSlot ?? (
            <Link
              href="/login"
              className="rounded-md px-1 text-paragraph-xs text-text-sub-600 transition-colors duration-150 ease-out focus-ring fine-hover:hover:text-text-strong-950"
            >
              Sign in
            </Link>
          )}
          <ThemeToggle />
        </div>
      </header>

      <section className="relative z-10 grid min-h-[calc(100dvh-4.5rem)] grid-cols-1 items-end gap-12 px-6 pb-16 pt-10 md:grid-cols-12 md:items-center md:gap-8 md:px-10 md:pb-20 md:pt-0">
        <div className="md:col-span-6 lg:col-span-5">
          <h1
className="landing-enter landing-enter-delay-1 display"
          >
            Shortlist
          </h1>
          <p className="landing-enter landing-enter-delay-2 mt-6 max-w-[22rem] lede text-text-strong-950">
            A digest of accounts, delivered every week.
          </p>
          <p className="landing-enter landing-enter-delay-3 mt-4 max-w-[26rem] text-paragraph-sm text-text-sub-600">
            Who to contact, why they fit, and what to say. Built for studios that sell with relationships — not CRMs.
          </p>
          <div className="landing-enter landing-enter-delay-4 mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href={ctaHref}
              className="press inline-flex h-10 items-center rounded-10 bg-primary-base px-3.5 text-label-sm text-static-white transition-[background-color,transform] duration-150 ease-out focus-ring fine-hover:hover:bg-primary-dark"
            >
              {ctaLabel}
            </Link>
            <span className="text-paragraph-xs text-text-sub-600">Three minutes. No CRM.</span>
          </div>
        </div>

        <div className="landing-enter landing-enter-delay-5 relative md:col-span-6 lg:col-span-7">
          <div className="border-t border-stroke-soft-200 pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-10">
            <LandingRolodex />
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-stroke-soft-200 px-6 py-20 md:px-10 md:py-28">
        <h2 className="max-w-xl display-sub">
          Pipeline software is for people who like software.
          <span className="text-text-sub-600"> You like clients.</span>
        </h2>
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {BEATS.map((beat) => (
            <li key={beat.n} className="flex flex-col gap-3">
              <p className="kicker">
                {beat.n} <span aria-hidden="true">|</span> <span className="kicker-strong">{beat.label}</span>
              </p>
              <p className="max-w-[18rem] text-paragraph-sm text-text-sub-600">{beat.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="relative z-10 flex items-center justify-between border-t border-stroke-soft-200 px-6 py-6 md:px-10">
        <p className="text-paragraph-xs text-text-sub-600">Shortlist by Revlo</p>
        <Link
          href={ctaHref}
          className="text-paragraph-xs text-text-sub-600 transition-colors duration-150 fine-hover:hover:text-text-strong-950"
        >
          Get this week&apos;s drop
        </Link>
      </footer>
    </div>
  )
}
