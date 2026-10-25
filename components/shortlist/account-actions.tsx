import { Globe, Linkedin, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

function ActionLink({
  href,
  label,
  icon,
}: {
  href: string
  label: string
  icon: React.ReactNode
}) {
  const external = !href.startsWith('mailto:')

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-1.5 text-paragraph-xs text-text-strong-950',
        'underline-offset-2 fine-hover:underline',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base',
      )}
    >
      <span className="shrink-0 text-text-sub-600" aria-hidden="true">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </a>
  )
}

function siteHref(domain: string) {
  const trimmed = domain.trim()
  if (!trimmed) return null
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
}

/**
 * Expanded-only outreach affordances. Email appears only when verified at delivery.
 * Tolerates stale digests missing newer fields (pre-schema sessions).
 */
export function AccountActions({
  email,
  domain,
  linkedinUrl,
  contactName,
  company,
  className,
}: {
  email?: string | null
  domain?: string | null
  linkedinUrl?: string | null
  contactName?: string
  company?: string
  className?: string
}) {
  const site = domain ? siteHref(domain) : null
  const linkedin =
    linkedinUrl?.trim() ||
    (contactName
      ? `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(
          [contactName, company].filter(Boolean).join(' '),
        )}`
      : null)

  if (!email && !site && !linkedin) return null

  return (
    <ul className={cn('flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2', className)}>
      {email ? (
        <li className="min-w-0">
          <ActionLink href={`mailto:${email}`} label={email} icon={<Mail className="size-3.5" />} />
        </li>
      ) : null}
      {site && domain ? (
        <li className="min-w-0">
          <ActionLink href={site} label={domain} icon={<Globe className="size-3.5" />} />
        </li>
      ) : null}
      {linkedin ? (
        <li className="min-w-0">
          <ActionLink href={linkedin} label="LinkedIn" icon={<Linkedin className="size-3.5" />} />
        </li>
      ) : null}
    </ul>
  )
}
