import type { ReactNode } from 'react'

export function StepHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="kicker">{eyebrow}</p>
      <h1 className="page-title">{title}</h1>
      {description ? <p className="text-paragraph-sm text-pretty text-text-sub-600">{description}</p> : null}
    </div>
  )
}
