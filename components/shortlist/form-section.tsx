"use client";

import type { ReactNode } from "react";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TONES, type Tone } from "@/lib/shortlist/tones";
import { cn } from "@/lib/utils";

export function FormSection({
  id,
  index,
  title,
  description,
  summary,
  icon: Icon,
  tone,
  complete,
  invalid,
  open,
  onOpenChange,
  children,
}: {
  id: string;
  index: number;
  title: string;
  description: string;
  summary?: string;
  icon: LucideIcon;
  tone: Tone;
  complete: boolean;
  invalid?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const showSummary = !open && complete && summary;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} asChild>
      <Card
        className={cn(
          "gap-0 py-0 transition-colors",
          invalid && "border-destructive/50",
        )}
      >
        <CollapsibleTrigger
          className="group flex w-full items-center gap-4 rounded-20 px-5 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary-base/50"
          aria-controls={`${id}-content`}
        >
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
              complete ? TONES.green.tile : TONES[tone].tile,
            )}
          >
            {complete ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Icon className="size-4" aria-hidden="true" />
            )}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex items-baseline gap-2">
              <span className="text-paragraph-xs tabular" aria-hidden="true">
                {String(index).padStart(2, "0")}
              </span>
              <span className="text-label-sm text-text-strong-950">{title}</span>
              {complete ? <span className="sr-only">(complete)</span> : null}
            </span>
            <span className="truncate text-paragraph-sm text-text-sub-600">
              {showSummary ? summary : description}
            </span>
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-text-sub-600 transition-transform duration-200 group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </CollapsibleTrigger>
        <CollapsibleContent
          id={`${id}-content`}
          className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
        >
          <div className="px-5 pt-1 pb-5">{children}</div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
