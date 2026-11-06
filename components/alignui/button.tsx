// AlignUI Button v0.0.0 — adapted to the Shortlist brand.
//
// Primary is a filled deep-blue action (`primary-base`, ~9:1 with its label).
// Sky is a mark only and never a filled button (docs/design-principles.md).
// Every variant shares one focus ring, one radius (control, 10px), one press
// response, and hover gated to fine pointers so touch never sticks.

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import type { PolymorphicComponentProps } from "@/utils/polymorphic";
import { recursiveCloneChildren } from "@/utils/recursive-clone-children";
import { tv, type VariantProps } from "@/utils/tv";

const BUTTON_ROOT_NAME = "ButtonRoot";
const BUTTON_ICON_NAME = "ButtonIcon";

export const buttonVariants = tv({
  slots: {
    root: [
      "group relative inline-flex items-center justify-center whitespace-nowrap rounded-10 text-label-sm",
      "transition-[background-color,color,box-shadow,transform] duration-150 ease-out",
      "focus-ring press",
      "disabled:pointer-events-none disabled:bg-bg-soft-200 disabled:text-text-disabled-300 disabled:ring-transparent",
    ],
    icon: ["flex size-5 shrink-0 items-center justify-center"],
  },
  variants: {
    variant: {
      primary: {},
      neutral: {},
      error: {},
    },
    mode: {
      filled: {},
      stroke: { root: "ring-1 ring-inset" },
      lighter: { root: "ring-1 ring-inset" },
      ghost: { root: "ring-1 ring-inset" },
    },
    size: {
      medium: { root: "h-10 gap-2 px-3.5", icon: "-mx-1" },
      small: { root: "h-8 gap-1.5 px-2.5", icon: "-mx-0.5 size-4" },
      // Legacy sizes kept for AlignUI parity; they collapse onto the two real ones.
      xsmall: { root: "h-8 gap-1.5 px-2.5", icon: "-mx-0.5 size-4" },
      xxsmall: { root: "h-8 gap-1.5 px-2.5", icon: "-mx-0.5 size-4" },
    },
  },
  compoundVariants: [
    {
      variant: "primary",
      mode: "filled",
      class: { root: "bg-primary-base text-static-white fine-hover:hover:bg-primary-dark" },
    },
    {
      variant: "primary",
      mode: "stroke",
      class: {
        root: "bg-bg-white-0 text-primary-base ring-primary-base fine-hover:hover:bg-primary-alpha-10",
      },
    },
    {
      variant: "primary",
      mode: "lighter",
      class: {
        root: "bg-primary-alpha-10 text-primary-base ring-transparent fine-hover:hover:bg-primary-alpha-16",
      },
    },
    {
      variant: "primary",
      mode: "ghost",
      class: {
        root: "bg-transparent text-primary-base ring-transparent fine-hover:hover:bg-primary-alpha-10",
      },
    },
    {
      variant: "neutral",
      mode: "filled",
      class: { root: "bg-bg-strong-950 text-text-white-0 fine-hover:hover:bg-bg-surface-800" },
    },
    {
      variant: "neutral",
      mode: "stroke",
      class: {
        root: "bg-bg-white-0 text-text-strong-950 shadow-regular-xs ring-stroke-soft-200 fine-hover:hover:bg-bg-weak-50",
      },
    },
    {
      variant: "neutral",
      mode: "lighter",
      class: {
        root: "bg-bg-soft-200 text-text-strong-950 ring-transparent fine-hover:hover:bg-bg-sub-300",
      },
    },
    {
      variant: "neutral",
      mode: "ghost",
      class: {
        root: "bg-transparent text-text-sub-600 ring-transparent fine-hover:hover:bg-bg-soft-200 fine-hover:hover:text-text-strong-950",
      },
    },
    {
      variant: "error",
      mode: "filled",
      class: { root: "bg-error-base text-static-white fine-hover:hover:bg-error-dark" },
    },
    {
      variant: "error",
      mode: "stroke",
      class: {
        root: "bg-bg-white-0 text-error-base ring-error-base fine-hover:hover:bg-error-lighter",
      },
    },
    {
      variant: "error",
      mode: "lighter",
      class: {
        root: "bg-error-lighter text-error-base ring-transparent fine-hover:hover:bg-error-light",
      },
    },
    {
      variant: "error",
      mode: "ghost",
      class: {
        root: "bg-transparent text-error-base ring-transparent fine-hover:hover:bg-error-lighter",
      },
    },
  ],
  defaultVariants: {
    variant: "primary",
    mode: "filled",
    size: "medium",
  },
});

type ButtonSharedProps = VariantProps<typeof buttonVariants>;

type ButtonRootProps = VariantProps<typeof buttonVariants> &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
  };

const ButtonRoot = React.forwardRef<HTMLButtonElement, ButtonRootProps>(
  (
    { children, variant, mode, size, asChild, className, ...rest },
    forwardedRef,
  ) => {
    const uniqueId = React.useId();
    const Component = asChild ? Slot : "button";
    const { root } = buttonVariants({ variant, mode, size });

    const sharedProps: ButtonSharedProps = {
      variant,
      mode,
      size,
    };

    const extendedChildren = recursiveCloneChildren(
      children as React.ReactElement[],
      sharedProps,
      [BUTTON_ICON_NAME],
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
  },
);
ButtonRoot.displayName = BUTTON_ROOT_NAME;

function ButtonIcon<T extends React.ElementType>({
  variant,
  mode,
  size,
  as,
  className,
  ...rest
}: PolymorphicComponentProps<T, ButtonSharedProps>) {
  const Component = as || "div";
  const { icon } = buttonVariants({ mode, variant, size });

  return <Component className={icon({ class: className })} {...rest} />;
}
ButtonIcon.displayName = BUTTON_ICON_NAME;

export { ButtonRoot as Root, ButtonIcon as Icon };
