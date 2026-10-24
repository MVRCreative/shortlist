'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Check } from 'lucide-react'
import { Price } from '@/components/gtm/price'
import { TIERS } from '@/lib/gtm/pricing'
import type { TierId } from '@/lib/gtm/schemas'

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
      className="grid gap-3 pt-2 sm:grid-cols-3"
    >
      {TIERS.map((tier) => (
        <RadioGroupPrimitive.Item
          key={tier.id}
          value={tier.id}
          className="group relative flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-150 ease-out hover:border-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98] data-[state=checked]:border-primary data-[state=checked]:bg-primary-light data-[state=checked]:shadow-[inset_0_0_0_1px_var(--primary)] motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          {tier.recommended ? (
            <span className="absolute -top-2.5 left-3 rounded-full bg-primary px-2 py-0.5 text-chip text-primary-foreground">
              Most popular
            </span>
          ) : null}
          <span className="flex w-full items-center justify-between gap-2">
            <span className="text-label">{tier.name}</span>
            <span
              aria-hidden="true"
              className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-background transition-colors duration-150 ease-out group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary"
            >
              <RadioGroupPrimitive.Indicator>
                <Check className="size-3 text-primary-foreground" strokeWidth={3} />
              </RadioGroupPrimitive.Indicator>
            </span>
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-meta">{tier.label}</span>
            <Price amount={tier.price} />
          </span>
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  )
}
