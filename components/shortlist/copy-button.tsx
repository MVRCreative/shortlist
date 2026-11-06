'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Quiet clipboard control. Prefer icon-only beside body copy so the action
 * doesn't compete with the content (Emil: unseen details, not loud chrome).
 */
export function CopyButton({
  text,
  label = 'Copy',
  iconOnly = false,
  className,
}: {
  text: string
  label?: string
  iconOnly?: boolean
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      icon={iconOnly}
      aria-label={copied ? 'Copied' : label}
      onClick={handleCopy}
      className={cn('text-paragraph-xs', className)}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {iconOnly ? null : copied ? 'Copied' : label}
    </Button>
  )
}
