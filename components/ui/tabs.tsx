/**
 * Tabs
 *
 * Purpose: switch between views of the same object or page.
 *
 * The list is the same joined track as SegmentedPills. The selected segment
 * is a solid `foreground` fill with `background` type. `line` and
 * `default` share that track; `line` remains
 * so existing call sites keep working. Filters that narrow a list are
 * SegmentedPills, not Tabs.
 *
 * Height follows `sizing.control.md`. `touch` is 44px for a sticky bar.
 */
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit max-w-full items-stretch overflow-x-auto scrollbar-hide text-foreground group-data-[orientation=horizontal]/tabs:h-control-md group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:overflow-visible",
  {
    variants: {
      variant: {
        default: "",
        line: "",
      },
      size: {
        default: "",
        /** 44px for touch-first bars (community tabs). */
        touch: "group-data-[orientation=horizontal]/tabs:h-touch",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant, size }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "press relative inline-flex h-full min-w-0 flex-1 items-center justify-center gap-1.5 border border-border bg-transparent px-2.5 text-body whitespace-nowrap text-foreground outline-none transition-[color,background-color] duration-fast hover:bg-accent hover:text-accent-foreground focus-visible:z-10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 md:flex-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-md",
        "rounded-none border-l-0 first:rounded-l-lg first:border-l last:rounded-r-lg",
        "group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:flex-none group-data-[orientation=vertical]/tabs:justify-start group-data-[orientation=vertical]/tabs:rounded-lg group-data-[orientation=vertical]/tabs:border-l",
        "data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:hover:bg-foreground data-[state=active]:hover:text-background",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
