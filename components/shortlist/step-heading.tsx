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
      <p className="text-paragraph-xs">{eyebrow}</p>
      <h1 className="text-lg font-medium tracking-tight text-balance">{title}</h1>
      {description ? <p className="text-paragraph-sm text-pretty text-text-sub-600">{description}</p> : null}
    </div>
  )
}
