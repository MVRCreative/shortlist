import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { delimiter, join } from 'node:path'
import { homedir, tmpdir } from 'node:os'

/** Deepline enriches the delivered list only. Never the Ocean candidate pool. */
export const DEEPLINE_ENRICH_LIMIT = 10
const RUN_TIMEOUT_MS = 4 * 60 * 1000
/** Observed ~0.51 credits/company on company-to-contact-batch. */
const CONTACT_CREDITS_PER_ROW = 0.51
/** Observed ~0.23 credits/person on person-to-email-batch. */
const EMAIL_CREDITS_PER_ROW = 0.23

/** Second pass only for companies where every provider returned nobody. */
export const RETRY_ROLES =
  'Owner; Principal; Partner; President; CEO; Creative Director; Managing Director'
export const RETRY_SENIORITY = 'Founder; C-Level; VP; Head; Director'

const QUALIFIED_TITLE =
  /\b(co[-\s]?founder|founder|owner|principal|partner|ceo|president|managing\s+director|creative\s+director)\b/i

export type EnrichAccountInput = {
  name: string
  domain: string
  linkedinCompanyUrl?: string | null
}

export type DeeplineEnrichment = {
  domain: string
  contactName: string | null
  firstName: string | null
  lastName: string | null
  title: string | null
  email: string | null
  linkedinUrl: string | null
  /** Human sentence for the UI. Never a raw provider code. */
  missReason: string | null
  /** Raw play miss code for retry logic. */
  missCode: string | null
  emailNote: string | null
}

export function enrichmentBatchError(count: number): string | null {
  if (count > DEEPLINE_ENRICH_LIMIT) {
    return `Refusing to send ${count} accounts to Deepline. Enrich only the final ${DEEPLINE_ENRICH_LIMIT}.`
  }
  return null
}

export function rolesFromTitles(titles: string[]): string {
  const roles = titles
    .flatMap((title) => title.split(/[/|,;]/))
    .map((part) => part.trim())
    .filter((part) => part.length > 1 && part.length <= 80)
  return [...new Set(roles)].slice(0, 8).join('; ')
}

export function seniorityFromTitles(titles: string[]): string {
  const text = titles.join(' ').toLowerCase()
  const levels = ['C-Level', 'VP', 'Head', 'Director']
  if (/\b(founder|ceo|owner|chief)\b/.test(text)) levels.unshift('Founder')
  return levels.join('; ')
}

export function creditCap(rows: number, perRow: number): number {
  return Math.max(1, Math.ceil(rows * perRow * 1.2))
}

function csvCell(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

export function accountsToCsv(
  accounts: EnrichAccountInput[],
  buyerTitles: string[],
  options?: { roles?: string; seniority?: string },
): string {
  const roles = options?.roles ?? rolesFromTitles(buyerTitles)
  const seniority = options?.seniority ?? seniorityFromTitles(buyerTitles)
  const lines = ['company_name,domain,linkedin_company_url,roles,seniority,limit']
  for (const account of accounts) {
    lines.push(
      [
        account.name,
        account.domain,
        account.linkedinCompanyUrl?.trim() ?? '',
        roles,
        seniority,
        '1',
      ]
        .map(csvCell)
        .join(','),
    )
  }
  return `${lines.join('\n')}\n`
}

export function peopleToEmailCsv(
  people: {
    domain: string
    companyName: string
    firstName: string | null
    lastName: string | null
    linkedinUrl: string | null
  }[],
): string {
  const lines = ['first_name,last_name,domain,company_name,linkedin_url']
  for (const person of people) {
    lines.push(
      [
        person.firstName ?? '',
        person.lastName ?? '',
        person.domain,
        person.companyName,
        person.linkedinUrl ?? '',
      ]
        .map(csvCell)
        .join(','),
    )
  }
  return `${lines.join('\n')}\n`
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text.length > 0 ? text : null
}

function normalizeDomain(value: string | null): string {
  return (value ?? '').toLowerCase().replace(/^www\./, '')
}

/** Map play miss codes to a sentence. Never return the raw code. */
export function humanMiss(reason: string | null): string {
  if (!reason) return 'No decision-maker found'
  const known: Record<string, string> = {
    missing_name: 'No decision-maker found',
    missing_linkedin_url: 'No decision-maker found',
    role_mismatch: 'No decision-maker found',
    role_evidence_missing: 'No decision-maker found',
    company_domain_mismatch: 'No decision-maker found',
    no_contacts: 'No decision-maker found',
    no_provider_candidates: 'No decision-maker found',
    no_usable_contacts: 'No decision-maker found',
    not_usable_contact: 'No decision-maker found',
    missing_identifiers: 'No verified email found',
    no_valid_work_email: 'No verified email found',
  }
  return known[reason] ?? 'No decision-maker found'
}

export function linkedinProfileUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    if (host !== 'linkedin.com' && !host.endsWith('.linkedin.com')) return null
    if (url.pathname.startsWith('/search')) return null
    if (!url.pathname.startsWith('/in/') && !url.pathname.startsWith('/pub/')) return null
    return url.toString()
  } catch {
    return null
  }
}

export function linkedinCompanyUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    if (host !== 'linkedin.com' && !host.endsWith('.linkedin.com')) return null
    if (!url.pathname.startsWith('/company/')) return null
    return url.toString()
  } catch {
    return null
  }
}

function titleWords(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((word) => word && !['of', 'and', 'the', 'for', 'at', 'in', 'a'].includes(word))
}

/** Titles Shortlist will keep after the prebuilt Founder filter rejects them. */
export function isQualifiedBuyerTitle(title: string | null, buyerTitles: string[]): boolean {
  if (!title) return false
  if (QUALIFIED_TITLE.test(title)) return true
  const words = new Set(titleWords(title))
  return buyerTitles
    .flatMap((entry) => entry.split(/[/|,;]/))
    .map((part) => part.trim())
    .filter((part) => part.length > 1)
    .some((role) => {
      const roleWords = titleWords(role)
      return roleWords.length > 0 && roleWords.every((word) => words.has(word))
    })
}

function companyMatchesCandidate(
  candidate: Record<string, unknown>,
  inputDomain: string,
  inputName?: string | null,
): boolean {
  const status = asString(candidate.company_match_status)
  if (status === 'mismatched') return false
  if (status === 'matched' || status === 'name_matched') return true
  const candidateDomain = normalizeDomain(asString(candidate.company_domain))
  if (candidateDomain && candidateDomain === inputDomain) return true
  const candidateName = asString(candidate.company_name)?.toLowerCase()
  const expectedName = inputName?.trim().toLowerCase()
  if (candidateName && expectedName && candidateName === expectedName) return true
  return status === null
}

function splitName(fullName: string | null): { firstName: string | null; lastName: string | null } {
  if (!fullName) return { firstName: null, lastName: null }
  const parts = fullName.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: null, lastName: null }
  if (parts.length === 1) return { firstName: parts[0] ?? null, lastName: null }
  return {
    firstName: parts[0] ?? null,
    lastName: parts.slice(1).join(' ') || null,
  }
}

function contactFromFields(input: {
  domain: string
  contactName: string | null
  firstName?: string | null
  lastName?: string | null
  title: string | null
  linkedinUrl: string | null
  email?: string | null
  emailNote?: string | null
  missCode?: string | null
}): DeeplineEnrichment {
  const split = splitName(input.contactName)
  return {
    domain: input.domain,
    contactName: input.contactName,
    firstName: input.firstName ?? split.firstName,
    lastName: input.lastName ?? split.lastName,
    title: input.title,
    email: input.email ?? null,
    linkedinUrl: input.linkedinUrl,
    missReason: null,
    missCode: input.missCode ?? null,
    emailNote: input.emailNote ?? null,
  }
}

function blankEnrichment(domain: string, missCode: string | null): DeeplineEnrichment {
  return {
    domain,
    contactName: null,
    firstName: null,
    lastName: null,
    title: null,
    email: null,
    linkedinUrl: null,
    missReason: humanMiss(missCode),
    missCode,
    emailNote: null,
  }
}

function pickRejectedCandidate(
  row: Record<string, unknown>,
  domain: string,
  buyerTitles: string[],
): DeeplineEnrichment | null {
  const rejected = Array.isArray(row.rejected_candidates) ? row.rejected_candidates : []
  const companyName = asString(row.company_name)
  for (const entry of rejected) {
    const candidate = asRecord(entry)
    if (!candidate) continue
    if (!companyMatchesCandidate(candidate, domain, companyName)) continue
    const title = asString(candidate.title)
    if (!isQualifiedBuyerTitle(title, buyerTitles)) continue
    const linkedinUrl = linkedinProfileUrl(asString(candidate.linkedin_url))
    if (!linkedinUrl) continue
    const contactName =
      asString(candidate.full_name) ||
      [asString(candidate.first_name), asString(candidate.last_name)].filter(Boolean).join(' ') ||
      null
    if (!contactName) continue
    return contactFromFields({
      domain,
      contactName,
      firstName: asString(candidate.first_name),
      lastName: asString(candidate.last_name),
      title,
      linkedinUrl,
    })
  }
  return null
}

export function enrichmentFromRow(
  row: Record<string, unknown>,
  buyerTitles: string[] = [],
): DeeplineEnrichment | null {
  const domain = normalizeDomain(asString(row.domain) ?? asString(row.company_domain))
  if (!domain) return null

  const contacts = Array.isArray(row.contacts) ? row.contacts : []
  const contact = asRecord(contacts[0])
  const firstName =
    asString(row.first_contact_first_name) ?? asString(contact?.first_name)
  const lastName =
    asString(row.first_contact_last_name) ?? asString(contact?.last_name)
  const contactName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    asString(contact?.full_name) ||
    null
  const title = asString(row.first_contact_title) ?? asString(contact?.title)
  const linkedinUrl = linkedinProfileUrl(
    asString(row.first_contact_linkedin_url) ?? asString(contact?.linkedin_url),
  )
  const missCode = asString(row.miss_reason) ?? asString(contact?.miss_reason)

  if (row.contact_found === true && contactName && linkedinUrl) {
    return contactFromFields({
      domain,
      contactName,
      firstName,
      lastName,
      title,
      linkedinUrl,
      missCode: null,
    })
  }

  const rescued = pickRejectedCandidate(row, domain, buyerTitles)
  if (rescued) return rescued

  return blankEnrichment(domain, missCode)
}

function rowsFromPayload(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.flatMap((row) => {
      const record = asRecord(row)
      return record ? [record] : []
    })
  }
  const record = asRecord(payload)
  if (!record) return []
  const nested = [
    record.rows,
    asRecord(record.result)?.rows,
    asRecord(record.data)?.rows,
    asRecord(record.output)?.rows,
  ]
  for (const candidate of nested) {
    if (!Array.isArray(candidate)) continue
    return candidate.flatMap((row) => {
      const item = asRecord(row)
      return item ? [item] : []
    })
  }
  return []
}

export function parseDeeplinePayload(
  payload: unknown,
  buyerTitles: string[] = [],
): DeeplineEnrichment[] {
  const byDomain = new Map<string, DeeplineEnrichment>()
  for (const row of rowsFromPayload(payload)) {
    const enrichment = enrichmentFromRow(row, buyerTitles)
    if (!enrichment || byDomain.has(enrichment.domain)) continue
    byDomain.set(enrichment.domain, enrichment)
  }
  return [...byDomain.values()]
}

export function parseEmailPayload(payload: unknown): Map<string, { email: string | null; validated: boolean; missReason: string | null }> {
  const byDomain = new Map<string, { email: string | null; validated: boolean; missReason: string | null }>()
  for (const row of rowsFromPayload(payload)) {
    const domain = normalizeDomain(asString(row.domain) ?? asString(row.company_domain))
    if (!domain || byDomain.has(domain)) continue
    const email = asString(row.email)
    const validated = row.email_validated === true
    byDomain.set(domain, {
      email: email && email.includes('@') ? email : null,
      validated,
      missReason: asString(row.miss_reason),
    })
  }
  return byDomain
}

function parseReceipt(stdout: string): Record<string, unknown> | null {
  const trimmed = stdout.trim()
  if (!trimmed) return null
  try {
    return asRecord(JSON.parse(trimmed))
  } catch {
    const start = trimmed.lastIndexOf('\n{')
    if (start === -1) return null
    try {
      return asRecord(JSON.parse(trimmed.slice(start + 1)))
    } catch {
      return null
    }
  }
}

const LOCAL_DEEPLINE_CLI = join(process.cwd(), 'node_modules', 'deepline', 'dist', 'cli', 'index.mjs')

const ENRICHMENT_UNAVAILABLE =
  'We couldn’t look up contacts for these companies right now. Try again in a few minutes.'

function deeplineCommand(args: string[]): { command: string; args: string[] } {
  // Prefer the project-installed CLI so it works without a global install (and on Vercel).
  if (existsSync(LOCAL_DEEPLINE_CLI)) {
    return { command: process.execPath, args: [LOCAL_DEEPLINE_CLI, ...args] }
  }
  return { command: 'deepline', args }
}

function runDeepline(args: string[], cwd: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const invocation = deeplineCommand(args)
    const child = spawn(invocation.command, invocation.args, {
      cwd,
      env: {
        ...process.env,
        PATH: `${join(homedir(), '.local', 'bin')}${delimiter}${process.env.PATH ?? ''}`,
      },
    })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error('Deepline enrichment timed out after 4 minutes.'))
    }, RUN_TIMEOUT_MS)
    child.stdout.on('data', (chunk: Buffer | string) => {
      stdout += String(chunk)
    })
    child.stderr.on('data', (chunk: Buffer | string) => {
      stderr += String(chunk)
    })
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code: code ?? 1, stdout, stderr })
    })
  })
}

function creditsFromReceipt(receipt: Record<string, unknown> | null): number | null {
  const value = receipt?.credits
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return value
}

function clip(value: string) {
  const text = value.trim()
  if (text.length <= 500) return text
  return `${text.slice(0, 500)}…`
}

function sumCredits(...parts: Array<number | null>): number | null {
  const values = parts.filter((value): value is number => typeof value === 'number')
  if (values.length === 0) return null
  return values.reduce((total, value) => total + value, 0)
}

type PlayRunResult =
  | { ok: true; payload: unknown; credits: number | null; runId: string | null; warning: string | null }
  | { ok: false; error: string }

async function runPlay(
  play: string,
  csvPath: string,
  jsonPath: string,
  maxCredits: number,
  directory: string,
): Promise<PlayRunResult> {
  if (!process.env.DEEPLINE_API_KEY) {
    console.error('[deepline] DEEPLINE_API_KEY is not set; skipping enrichment.')
    return { ok: false, error: ENRICHMENT_UNAVAILABLE }
  }

  let result: { code: number; stdout: string; stderr: string }
  try {
    result = await runDeepline(
      [
        'run',
        play,
        '--input',
        JSON.stringify({ csv: csvPath }),
        '--json',
        '--json-out',
        jsonPath,
        '--max-credits',
        String(maxCredits),
        '--timeout',
        '4m',
      ],
      directory,
    )
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Deepline failed to start.'
    console.error('[deepline] CLI failed to start:', detail)
    return { ok: false, error: ENRICHMENT_UNAVAILABLE }
  }

  const receipt = parseReceipt(result.stdout)
  const credits = creditsFromReceipt(receipt)
  const runId = asString(receipt?.id)
  const status = asString(receipt?.status)
  const receiptError =
    asString(receipt?.error) ||
    asString(asRecord(receipt?.error)?.message) ||
    null
  let payload: unknown = null
  try {
    payload = JSON.parse(await readFile(jsonPath, 'utf8'))
  } catch {
    payload = null
  }
  if (payload === null) {
    const detail = receiptError || clip(result.stderr) || clip(result.stdout) || `exit ${result.code}`
    console.error('[deepline] enrichment failed:', detail)
    return { ok: false, error: ENRICHMENT_UNAVAILABLE }
  }
  const warning =
    result.code !== 0 || (status !== null && status !== 'completed' && status !== 'dry_run')
      ? `Deepline finished incompletely${status ? ` (${status})` : ''}${receiptError ? `: ${receiptError}` : ''}.`
      : null
  return { ok: true, payload, credits, runId, warning }
}

function mergeContactMaps(
  base: Map<string, DeeplineEnrichment>,
  next: Map<string, DeeplineEnrichment>,
): Map<string, DeeplineEnrichment> {
  const merged = new Map(base)
  for (const [domain, enrichment] of next) {
    const previous = merged.get(domain)
    if (!previous?.contactName && enrichment.contactName) {
      merged.set(domain, enrichment)
      continue
    }
    if (!previous) merged.set(domain, enrichment)
  }
  return merged
}

export async function enrichAccountsWithDeepline(
  accounts: EnrichAccountInput[],
  buyerTitles: string[],
): Promise<
  | {
      ok: true
      byDomain: Map<string, DeeplineEnrichment>
      credits: number | null
      runId: string | null
      warning: string | null
    }
  | { ok: false; error: string }
> {
  const tooMany = enrichmentBatchError(accounts.length)
  if (tooMany) return { ok: false, error: tooMany }
  if (accounts.length === 0) {
    return { ok: true, byDomain: new Map(), credits: null, runId: null, warning: null }
  }

  const directory = await mkdtemp(join(tmpdir(), 'shortlist-deepline-'))
  const warnings: string[] = []
  let totalCredits: number | null = null
  let primaryRunId: string | null = null

  try {
    const firstCsv = join(directory, 'accounts.csv')
    const firstJson = join(directory, 'contacts.json')
    await writeFile(firstCsv, accountsToCsv(accounts, buyerTitles), 'utf8')
    const first = await runPlay(
      'prebuilt/company-to-contact-batch',
      firstCsv,
      firstJson,
      creditCap(accounts.length, CONTACT_CREDITS_PER_ROW),
      directory,
    )
    if (!first.ok) return first
    totalCredits = sumCredits(totalCredits, first.credits)
    primaryRunId = first.runId
    if (first.warning) warnings.push(first.warning)

    let byDomain = new Map(
      parseDeeplinePayload(first.payload, buyerTitles).map((row) => [row.domain, row]),
    )

    const retryAccounts = accounts.filter((account) => {
      const enrichment = byDomain.get(normalizeDomain(account.domain))
      return !enrichment?.contactName && enrichment?.missCode === 'no_provider_candidates'
    })

    if (retryAccounts.length > 0) {
      const retryCsv = join(directory, 'retry.csv')
      const retryJson = join(directory, 'retry.json')
      await writeFile(
        retryCsv,
        accountsToCsv(retryAccounts, buyerTitles, {
          roles: RETRY_ROLES,
          seniority: RETRY_SENIORITY,
        }),
        'utf8',
      )
      const retry = await runPlay(
        'prebuilt/company-to-contact-batch',
        retryCsv,
        retryJson,
        creditCap(retryAccounts.length, CONTACT_CREDITS_PER_ROW),
        directory,
      )
      if (!retry.ok) {
        warnings.push(retry.error)
      } else {
        totalCredits = sumCredits(totalCredits, retry.credits)
        if (retry.warning) warnings.push(retry.warning)
        const retryRows = new Map(
          parseDeeplinePayload(retry.payload, buyerTitles).map((row) => [row.domain, row]),
        )
        byDomain = mergeContactMaps(byDomain, retryRows)
      }
    }

    for (const account of accounts) {
      const domain = normalizeDomain(account.domain)
      if (!byDomain.has(domain)) {
        byDomain.set(domain, blankEnrichment(domain, 'no_contacts'))
      }
    }

    const people = accounts.flatMap((account) => {
      const enrichment = byDomain.get(normalizeDomain(account.domain))
      if (!enrichment?.contactName) return []
      return [
        {
          domain: enrichment.domain,
          companyName: account.name,
          firstName: enrichment.firstName,
          lastName: enrichment.lastName,
          linkedinUrl: enrichment.linkedinUrl,
        },
      ]
    })

    if (people.length > 0) {
      const emailCsv = join(directory, 'people.csv')
      const emailJson = join(directory, 'emails.json')
      await writeFile(emailCsv, peopleToEmailCsv(people), 'utf8')
      const emails = await runPlay(
        'prebuilt/person-to-email-batch',
        emailCsv,
        emailJson,
        creditCap(people.length, EMAIL_CREDITS_PER_ROW),
        directory,
      )
      if (!emails.ok) {
        warnings.push(emails.error)
      } else {
        totalCredits = sumCredits(totalCredits, emails.credits)
        if (emails.warning) warnings.push(emails.warning)
        const emailRows = parseEmailPayload(emails.payload)
        for (const [domain, emailRow] of emailRows) {
          const current = byDomain.get(domain)
          if (!current?.contactName) continue
          if (emailRow.email && emailRow.validated) {
            byDomain.set(domain, {
              ...current,
              email: emailRow.email,
              emailNote: null,
            })
          } else {
            byDomain.set(domain, {
              ...current,
              email: null,
              emailNote: emailRow.missReason
                ? humanMiss(emailRow.missReason)
                : 'No verified email found',
            })
          }
        }
      }
    }

    return {
      ok: true,
      byDomain,
      credits: totalCredits,
      runId: primaryRunId,
      warning: warnings.length > 0 ? warnings.join(' ') : null,
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}
