/**
 * ConfirmDialog / useConfirm
 *
 * Purpose: the one way to ask "are you sure?". Never `window.confirm` — it
 * ignores theme, blocks the thread, and cannot be styled or tested.
 *
 * - `ConfirmDialog`: controlled. Use when the confirm opens from a button.
 * - `useConfirm()`: promise-based. Use mid-flow (inside a save) where the
 *   code needs a yes/no before it continues:
 *
 *     const [confirm, confirmDialog] = useConfirm()
 *     if (!(await confirm({ title: "Remove 2 questions?", confirmLabel: "Remove", destructive: true }))) return
 *     …
 *     return <>{…}{confirmDialog}</>
 *
 * Copy: the title is the question with its object ("Remove Priya from
 * Riverside?"), the confirm label repeats the verb ("Remove"), cancel is
 * "Cancel" unless a better "keep" phrase exists. `destructive` paints the
 * confirm red; it is the last button on desktop and the first on phones.
 */
"use client"

import { useCallback, useRef, useState, type ReactNode } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"

export type ConfirmOptions = {
  title: string
  description?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  pending = false,
  onConfirm,
  children,
}: ConfirmOptions & {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Keeps the dialog open with a busy confirm while the action runs. */
  pending?: boolean
  onConfirm: () => void
  /** Inputs that shape the action (e.g. which dates to cancel). Keep it to one choice. */
  children?: ReactNode
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            aria-busy={pending || undefined}
            onClick={(event) => {
              if (pending) return
              event.preventDefault()
              onConfirm()
            }}
          >
            {pending ? <Spinner aria-hidden role={undefined} aria-label={undefined} /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function useConfirm(): [(options: ConfirmOptions) => Promise<boolean>, ReactNode] {
  // Options outlive `open` so the dialog keeps its copy through the exit animation.
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [open, setOpen] = useState(false)
  const resolver = useRef<((value: boolean) => void) | null>(null)

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setOpen(false)
  }, [])

  const confirm = useCallback((next: ConfirmOptions) => {
    resolver.current?.(false)
    setOptions(next)
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const element = options ? (
    <ConfirmDialog
      {...options}
      open={open}
      onOpenChange={(next) => {
        if (!next) settle(false)
      }}
      onConfirm={() => settle(true)}
    />
  ) : null

  return [confirm, element]
}
