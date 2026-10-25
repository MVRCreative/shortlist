'use client'

import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { Check } from 'lucide-react'
import { Price } from '@/components/shortlist/price'
import { TIERS } from '@/lib/shortlist/pricing'
import type { TierId } from '@/lib/shortlist/schemas'

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
          className="press group relative flex flex-col items-start gap-3 rounded-20 bg-bg-white-0 p-4 text-left shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 transition duration-200 ease-out fine-hover:bg-bg-weak-50 focus-visible:shadow-button-primary-focus data-[state=checked]:bg-primary-alpha-10 data-[state=checked]:ring-primary-base"
        >
          {tier.recommended ? (
            <span className="absolute -top-2.5 left-3 rounded-full bg-primary-base px-2 py-0.5 text-label-xs text-static-white">
              Most popular
            </span>
          ) : null}
          <span className="flex w-full items-center justify-between gap-2">
            <span className="text-label-sm">{tier.name}</span>
            <span
              aria-hidden="true"
              className="flex size-5 shrink-0 items-center justify-center rounded-full bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 transition duration-200 ease-out group-data-[state=checked]:bg-primary-base group-data-[state=checked]:ring-primary-base"
            >
              <RadioGroupPrimitive.Indicator>
                <Check className="size-3 text-static-white" strokeWidth={3} />
              </RadioGroupPrimitive.Indicator>
            </span>
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-paragraph-xs">{tier.label}</span>
            <Price amount={tier.price} />
          </span>
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  )
}
