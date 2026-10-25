import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex h-6 w-fit max-w-full min-w-0 shrink items-center justify-center gap-1 overflow-hidden rounded-md px-2 text-label-xs whitespace-nowrap ring-1 ring-inset [&>span]:truncate',
  {
    variants: {
      variant: {
        default: 'bg-primary-alpha-10 text-primary-base ring-transparent',
        secondary: 'bg-bg-weak-50 text-text-sub-600 ring-transparent',
        destructive: 'bg-error-lighter text-error-base ring-transparent',
        success: 'bg-success-lighter text-success-base ring-transparent',
        danger: 'bg-error-lighter text-error-base ring-transparent',
        warning: 'bg-warning-lighter text-warning-base ring-transparent',
        info: 'bg-information-lighter text-information-base ring-transparent',
        brand: 'bg-primary-alpha-10 text-primary-base ring-transparent',
        neutral: 'bg-bg-white-0 text-text-sub-600 ring-stroke-soft-200',
        outline: 'bg-bg-white-0 text-text-sub-600 ring-stroke-soft-200',
        ghost: 'bg-transparent text-text-sub-600 ring-transparent',
        link: 'bg-transparent text-primary-base ring-transparent underline-offset-4',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span'
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
