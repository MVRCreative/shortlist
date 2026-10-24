'use client'

import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { Globe, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FieldDescription, FieldError, FieldLegend, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ChoiceChip } from '@/components/gtm/choice-chip'
import { faviconUrl, normalizeDomain, normalizeUrl } from '@/lib/gtm/url'
import { cn } from '@/lib/utils'

function toggleItem(list: string[], item: string) {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item]
}

export function OptionalTag() {
  return <span className="text-meta font-normal">Optional</span>
}

function AddChipInput({ id, label, onAdd }: { id: string; label: string; onAdd: (value: string) => void }) {
  const [draft, setDraft] = useState('')

  function commit() {
    const value = draft.trim()
    if (value) onAdd(value)
    setDraft('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    commit()
  }

  return (
    <>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <Input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder="+ Add another"
        className="h-8 w-36 rounded-full px-3 text-sm"
      />
    </>
  )
}

export function ChipField({
  id,
  legend,
  description,
  options,
  selected,
  onChange,
  addLabel,
  selectedClassName,
}: {
  id: string
  legend: ReactNode
  description?: string
  options: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
  /** Accessible label for the inline "+ Add another" input. Omit to hide it. */
  addLabel?: string
  selectedClassName?: (value: string) => string
}) {
  const all = addLabel ? [...new Set<string>([...options, ...selected])] : options

  function addCustom(value: string) {
    if (!selected.some((item) => item.toLowerCase() === value.toLowerCase())) onChange([...selected, value])
  }

  return (
    <FieldSet className="gap-3">
      <FieldLegend variant="label" className={cn('flex items-baseline gap-2', description && 'mb-1')}>
        {legend}
      </FieldLegend>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <div className="flex flex-wrap gap-2">
        {all.map((option) => (
          <ChoiceChip
            key={option}
            selected={selected.includes(option)}
            selectedClassName={selectedClassName?.(option)}
            onToggle={() => onChange(toggleItem(selected, option))}
          >
            {option}
          </ChoiceChip>
        ))}
        {addLabel ? <AddChipInput id={`${id}-custom`} label={addLabel} onAdd={addCustom} /> : null}
      </div>
    </FieldSet>
  )
}

export function UrlListField({
  id,
  legend,
  description,
  values,
  onChange,
  minRows,
  maxRows = 3,
  placeholder,
  kind,
  showFavicons,
  error,
}: {
  id: string
  legend: ReactNode
  description: string
  values: string[]
  onChange: (next: string[]) => void
  minRows: number
  maxRows?: number
  placeholder: (index: number) => string
  /** `domain` normalizes to a bare domain; `url` keeps the path. */
  kind: 'domain' | 'url'
  showFavicons?: boolean
  error?: string
}) {
  const [touched, setTouched] = useState<Set<number>>(() => new Set())
  const normalize = kind === 'domain' ? normalizeDomain : normalizeUrl

  function setRow(index: number, value: string) {
    onChange(values.map((current, i) => (i === index ? value : current)))
  }

  function removeRow(index: number) {
    onChange(values.filter((_, i) => i !== index))
    setTouched(new Set())
  }

  return (
    <FieldSet className="gap-3">
      <FieldLegend variant="label" className="mb-1 flex items-baseline gap-2">
        {legend}
      </FieldLegend>
      <FieldDescription>{description}</FieldDescription>
      <ul className="flex flex-col gap-2">
        {values.map((value, index) => {
          const normalized = value.trim() ? normalize(value) : null
          const invalid = touched.has(index) && !!value.trim() && !normalized
          const domain = normalized ? normalizeDomain(normalized) : null
          const inputId = `${id}-${index}`
          return (
            <li key={index} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {showFavicons ? (
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40"
                    aria-hidden="true"
                  >
                    {domain ? (
                      // eslint-disable-next-line @next/next/no-img-element -- remote favicon, no optimization needed
                      <img src={faviconUrl(domain)} alt="" width={16} height={16} className="size-4 rounded-sm" />
                    ) : (
                      <Globe className="size-4 text-muted-foreground" />
                    )}
                  </span>
                ) : null}
                <label htmlFor={inputId} className="sr-only">
                  {`${typeof legend === 'string' ? legend : 'Website'} ${index + 1}`}
                </label>
                <Input
                  id={inputId}
                  value={value}
                  onChange={(event) => setRow(index, event.target.value)}
                  onBlur={() => setTouched((prev) => new Set(prev).add(index))}
                  placeholder={placeholder(index)}
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? `${inputId}-error` : undefined}
                  className="flex-1"
                />
                {index >= minRows ? (
                  <Button
                    type="button"
                    variant="ghost"
                    tone="muted"
                    size="icon-sm"
                    aria-label={`Remove row ${index + 1}`}
                    onClick={() => removeRow(index)}
                  >
                    <X />
                  </Button>
                ) : null}
              </div>
              {invalid ? (
                <p id={`${inputId}-error`} className={cn('text-meta text-destructive', showFavicons && 'pl-11')}>
                  {kind === 'domain' ? 'Enter a website, like acme.com' : 'Enter a link, like yourstudio.com/work/project'}
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>
      {values.length < maxRows ? (
        <Button
          type="button"
          variant="ghost"
          tone="muted"
          size="xs"
          className={cn('w-fit', showFavicons && 'ml-11')}
          onClick={() => onChange([...values, ''])}
        >
          <Plus />
          Add another
        </Button>
      ) : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </FieldSet>
  )
}
