'use client'

import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { Price } from '@/components/shortlist/price'
import { TIERS } from '@/lib/shortlist/pricing'
import type { TierId } from '@/lib/shortlist/schemas'
import { cn } from '@/lib/utils'

export function PlanSelector({
  value,
  onChange,
  labelledBy,
}: {
  value: TierId
  onChange: (tier: TierId) => void
  labelledBy: string
}) {
  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={(next) => onChange(next as TierId)}
      aria-labelledby={labelledBy}
      className="surface-group grid sm:grid-cols-3"
    >
      {TIERS.map((tier) => (
        <RadioGroupPrimitive.Item
          key={tier.id}
          value={tier.id}
          className={cn(
            'press group flex flex-col items-start gap-2 p-4 text-left transition-[background-color,border-color] duration-200 ease-out',
            'border-b border-stroke-soft-200 sm:border-b-0 sm:border-r sm:last:border-r-0',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-base',
            'data-[state=checked]:surface-selected data-[state=checked]:surface-selected-top',
          )}
        >
          <span className="kicker">{tier.name}</span>
          <span className="text-label-sm font-normal text-text-strong-950">{tier.label}</span>
          <Price amount={tier.price} />
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  )
}
