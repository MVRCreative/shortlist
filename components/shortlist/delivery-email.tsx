'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function DeliveryEmail({ email, onChange }: { email: string; onChange: (email: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(email)
  const changeRef = useRef<HTMLButtonElement>(null)
  const invalid = draft.trim() !== '' && !EMAIL_PATTERN.test(draft.trim())

  function close() {
    setEditing(false)
    requestAnimationFrame(() => changeRef.current?.focus())
  }

  function save(event: React.FormEvent) {
    event.preventDefault()
    const next = draft.trim()
    if (!EMAIL_PATTERN.test(next)) return
    onChange(next)
    close()
  }

  if (editing) {
    return (
      <form onSubmit={save} className="flex flex-wrap items-center gap-2">
        <label htmlFor="delivery-email" className="text-paragraph-xs">
          Delivered to
        </label>
        <Input
          id="delivery-email"
          type="email"
          autoComplete="email"
          autoFocus
          value={draft}
          aria-invalid={invalid || undefined}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setDraft(email)
              close()
            }
          }}
          className="h-8 min-w-0 flex-1 basis-48"
        />
        <Button type="submit" size="sm" disabled={invalid || draft.trim() === ''}>
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setDraft(email)
            close()
          }}
        >
          Cancel
        </Button>
      </form>
    )
  }

  return (
    <p className="text-paragraph-xs">
      Delivered to <span className="text-text-strong-950">{email}</span> ·{' '}
      <button
        ref={changeRef}
        type="button"
        onClick={() => {
          setDraft(email)
          setEditing(true)
        }}
        className="rounded-sm text-primary-base underline-offset-4 fine-hover:underline focus-ring"
      >
        Change
      </button>
    </p>
  )
}
