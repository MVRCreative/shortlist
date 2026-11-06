'use client'

import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { Globe, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FieldDescription, FieldError, FieldLegend, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ChoiceChip } from '@/components/shortlist/choice-chip'
import { normalizeDomain, normalizeUrl } from '@/lib/shortlist/url'
import { cn } from '@/lib/utils'

function toggleItem(list: string[], item: string) {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item]
}

export function OptionalTag() {
  return <span className="text-paragraph-xs font-normal text-text-soft-400">Optional</span>
}

function AddChipInput({
  id,
  label,
  placeholder,
  onAdd,
}: {
  id: string
  label: string
  placeholder: string
  onAdd: (value: string) => void
}) {
  const [draft, setDraft] = useState('')

  function commit() {
    const value = draft.trim()
    if (!value) return
    onAdd(value)
    setDraft('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' && event.key !== ',') return
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    commit()
  }

  return (
    <span className="inline-flex h-8 min-w-36 items-center gap-1.5 rounded-full border border-dashed border-stroke-sub-300 pl-2.5 pr-3 text-text-soft-400 transition-colors focus-within:border-solid focus-within:border-primary-base focus-within:text-text-sub-600">
      <Plus className="size-3.5 shrink-0" aria-hidden="true" />
      <label className="sr-only" htmlFor={id}>
        {`${label}. Press Enter or comma to add.`}
      </label>
      <input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={placeholder}
        size={Math.max(placeholder.length, draft.length, 8)}
        className="min-w-0 bg-transparent text-sm text-text-strong-950 outline-none placeholder:text-text-soft-400"
      />
    </span>
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
  addPlaceholder,
  onRemove,
  selectedClassName,
}: {
  id: string
  legend: ReactNode
  description?: string
  options: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
  /** Accessible label for the add field. Omit to hide it. */
  addLabel?: string
  addPlaceholder?: string
  onRemove?: (value: string) => void
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
            onRemove={onRemove ? () => onRemove(option) : undefined}
            removeLabel={`Remove ${option}`}
          >
            {option}
          </ChoiceChip>
        ))}
        {addLabel ? (
          <AddChipInput
            id={`${id}-custom`}
            label={addLabel}
            placeholder={addPlaceholder ?? 'Type one and press Enter'}
            onAdd={addCustom}
          />
        ) : null}
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
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-bg-weak-50/40"
                    aria-hidden="true"
                  >
                    {domain ? (
                      <span className="text-paragraph-xs text-text-sub-600">
                        {domain.slice(0, 1).toUpperCase()}
                      </span>
                    ) : (
                      <Globe className="size-4 text-text-sub-600" />
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
                    size="sm" icon
                    aria-label={`Remove row ${index + 1}`}
                    onClick={() => removeRow(index)}
                  >
                    <X />
                  </Button>
                ) : null}
              </div>
              {invalid ? (
                <p id={`${inputId}-error`} className={cn('text-paragraph-xs text-error-base', showFavicons && 'pl-11')}>
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
          size="sm"
          className="w-fit"
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
