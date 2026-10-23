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
    <div className="flex flex-col gap-3">
      <p className="text-eyebrow">{eyebrow}</p>
      <h1 className="text-editorial-title text-balance sm:text-editorial-display">{title}</h1>
      {description ? <p className="text-body-reading text-pretty text-muted-foreground">{description}</p> : null}
    </div>
  )
}
