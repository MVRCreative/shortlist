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
    <div className="flex flex-col gap-1">
      <p className="text-meta">{eyebrow}</p>
      <h1 className="text-lg font-medium tracking-tight text-balance">{title}</h1>
      {description ? <p className="text-body text-pretty text-muted-foreground">{description}</p> : null}
    </div>
  )
}
