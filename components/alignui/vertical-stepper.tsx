// AlignUI VerticalStepper v0.0.0

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { RiArrowRightSLine } from '@remixicon/react';

import { cnExt } from '@/utils/cn';
import type { PolymorphicComponentProps } from '@/utils/polymorphic';
import { recursiveCloneChildren } from '@/utils/recursive-clone-children';
import { tv, type VariantProps } from '@/utils/tv';

const VERTICAL_STEPPER_ROOT_NAME = 'VerticalStepperRoot';
const VERTICAL_STEPPER_ARROW_NAME = 'VerticalStepperArrow';
const VERTICAL_STEPPER_ITEM_NAME = 'VerticalStepperItem';
const VERTICAL_STEPPER_ITEM_INDICATOR_NAME = 'VerticalStepperItemIndicator';

function VerticalStepperRoot({
  asChild,
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean;
}) {
  const Component = asChild ? Slot : 'div';
  return (
    <Component className={cnExt('w-full space-y-2', className)} {...rest}>
      {children}
    </Component>
  );
}
VerticalStepperRoot.displayName = VERTICAL_STEPPER_ROOT_NAME;

function VerticalStepperArrow<T extends React.ElementType>({
  className,
  as,
  ...rest
}: PolymorphicComponentProps<T>) {
  const Component = as || RiArrowRightSLine;

  return (
    <Component
      className={cnExt('size-5 shrink-0 text-text-sub-600', className)}
      {...rest}
    />
  );
}
VerticalStepperArrow.displayName = VERTICAL_STEPPER_ARROW_NAME;

const verticalStepperItemVariants = tv({
  slots: {
    root: [
      // base — items-start keeps number column flush with the title line
      'grid w-full grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-x-2.5 rounded-10 px-2 py-2 text-left text-paragraph-sm',
    ],
    indicator: [
      // base
      'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-label-xs tabular-nums',
    ],
  },
  variants: {
    state: {
      completed: {
        root: 'text-text-sub-600',
        indicator: 'bg-primary-base text-static-white',
      },
      active: {
        root: 'text-text-strong-950',
        indicator: 'bg-bg-strong-950 text-static-white',
      },
      default: {
        root: 'text-text-sub-600',
        indicator: 'border border-stroke-soft-200 bg-bg-white-0 text-text-sub-600',
      },
    },
  },
  defaultVariants: {
    state: 'default',
  },
});

type VerticalStepperItemSharedProps = VariantProps<
  typeof verticalStepperItemVariants
>;

type VerticalStepperItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof verticalStepperItemVariants> & {
    asChild?: boolean;
  };

const VerticalStepperItem = React.forwardRef<
  HTMLButtonElement,
  VerticalStepperItemProps
>(({ asChild, children, state, className, ...rest }, forwardedRef) => {
  const uniqueId = React.useId();
  const Component = asChild ? Slot : 'button';
  const { root } = verticalStepperItemVariants({ state });

  const sharedProps: VerticalStepperItemSharedProps = {
    state,
  };

  const extendedChildren = recursiveCloneChildren(
    children as React.ReactElement[],
    sharedProps,
    [VERTICAL_STEPPER_ITEM_INDICATOR_NAME],
    uniqueId,
    asChild,
  );

  return (
    <Component
      ref={forwardedRef}
      className={root({ class: className })}
      {...rest}
    >
      {extendedChildren}
    </Component>
  );
});
VerticalStepperItem.displayName = VERTICAL_STEPPER_ITEM_NAME;

function VerticalStepperItemIndicator({
  state,
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & VerticalStepperItemSharedProps) {
  const { indicator } = verticalStepperItemVariants({ state });

  if (state === 'completed') {
    return (
      <div className={indicator({ class: className })} {...rest}>
        <svg viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg' fill='none'>
          <path
            fill='currentColor'
            d='M15.1 7.453 8.726 13.82 4.9 10l1.275-1.274 2.55 2.548 5.1-5.094L15.1 7.453Z'
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={indicator({ class: className })} {...rest}>
      {children}
    </div>
  );
}
VerticalStepperItemIndicator.displayName = VERTICAL_STEPPER_ITEM_INDICATOR_NAME;

export {
  VerticalStepperRoot as Root,
  VerticalStepperArrow as Arrow,
  VerticalStepperItem as Item,
  VerticalStepperItemIndicator as ItemIndicator,
};
