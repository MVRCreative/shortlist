import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const PAGE_BYTES = 400_000
const PAGE_TEXT = 4_000
const EXTRA_PAGES = 4
const TIMEOUT_MS = 8_000

const PREFERRED = [
  'about',
  'work',
  'services',
  'service',
  'clients',
  'customers',
  'case',
  'studio',
  'approach',
  'pricing',
  'who-we',
  'industries',
  'sectors',
  'what-we',
]

const SKIP_PATH = /(privacy|terms|cookie|login|signin|signup|cart|account|wp-admin|tag|category|feed)/

export type CrawledPage = {
  url: string
  text: string
  hrefs: string[]
}

export type CrawlResult =
  | { ok: true; pages: CrawledPage[]; corpus: string }
  | { ok: false; error: string }

export function isBlockedIp(ip: string): boolean {
  const normalized = ip.toLowerCase().replace(/^\[|\]$/g, '')
  if (normalized.startsWith('::ffff:')) return isBlockedIp(normalized.slice(7))
  if (normalized === '::1' || normalized === '::') return true
  if (normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80')) return true

  if (!normalized.includes('.')) return false
  const parts = normalized.split('.').map((part) => Number(part))
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true
  }
  const [a, b] = parts
  if (a === 0 || a === 10 || a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  return false
}

function blockedHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return true
  }
  if (host === 'metadata.google.internal') return true
  return false
}

async function assertPublicUrl(url: URL) {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('blocked')
  }
  if (url.username || url.password) throw new Error('blocked')
  if (url.port && url.port !== '80' && url.port !== '443') throw new Error('blocked')
  if (blockedHost(url.hostname)) throw new Error('blocked')

  if (isIP(url.hostname)) {
    if (isBlockedIp(url.hostname)) throw new Error('blocked')
    return
  }

  let records: { address: string }[]
  try {
    records = await lookup(url.hostname, { all: true, verbatim: true })
  } catch {
    throw new Error('dns')
  }
  if (records.length === 0 || records.some((record) => isBlockedIp(record.address))) {
    throw new Error('blocked')
  }
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, digits: string) => {
      const code = Number(digits)
      return code > 0 && code < 65536 ? String.fromCodePoint(code) : ''
    })
}

function htmlToText(html: string) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ''
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ??
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1] ??
    ''
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
  return decodeEntities(`${title}\n${description}\n${body}`)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .slice(0, PAGE_TEXT)
}

function hrefsFrom(html: string) {
  return [...html.matchAll(/href\s*=\s*["']([^"'#]+)["']/gi)].map((match) => match[1] ?? '')
}

function scorePath(pathname: string) {
  const path = pathname.toLowerCase()
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 0 || parts.length > 3) return -1
  if (SKIP_PATH.test(path)) return -1
  let score = parts.length === 1 ? 1 : 0
  for (const word of PREFERRED) {
    if (path.includes(word)) score += 3
  }
  return score
}

function collectLinks(html: string, base: URL) {
  const seen = new Set<string>()
  const scored: { url: URL; score: number }[] = []
  for (const href of hrefsFrom(html)) {
    if (/^(mailto:|tel:|javascript:)/i.test(href)) continue
    let url: URL
    try {
      url = new URL(href, base)
    } catch {
      continue
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') continue
    if (url.hostname !== base.hostname) continue
    if (/\.(pdf|zip|png|jpe?g|gif|svg|webp|css|js|xml|mp4|mp3|ico|woff2?)$/i.test(url.pathname)) continue
    url.hash = ''
    url.search = ''
    const key = url.pathname.replace(/\/$/, '') || '/'
    if (key === '/' || seen.has(key)) continue
    const score = scorePath(key)
    if (score < 0) continue
    seen.add(key)
    scored.push({ url, score })
  }
  const preferred = scored.filter((item) => item.score >= 3)
  const pool = preferred.length > 0 ? preferred : scored.filter((item) => item.score > 0)
  pool.sort((a, b) => b.score - a.score)
  return pool.slice(0, EXTRA_PAGES).map((item) => item.url)
}

async function readLimited(response: Response) {
  const reader = response.body?.getReader()
  if (!reader) return ''
  const decoder = new TextDecoder()
  let text = ''
  let received = 0
  while (received < PAGE_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    received += value.byteLength
    text += decoder.decode(value, { stream: true })
  }
  text += decoder.decode()
  await reader.cancel().catch(() => undefined)
  return text
}

async function fetchPage(start: URL): Promise<{ url: string; html: string } | null> {
  let current = start
  for (let hop = 0; hop < 4; hop += 1) {
    await assertPublicUrl(current)
    let response: Response
    try {
      response = await fetch(current, {
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          accept: 'text/html,application/xhtml+xml',
          'user-agent': 'ShortlistBot/1.0 (+https://revlo.io)',
        },
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') throw new Error('timeout')
      if (error instanceof Error && (error.message === 'blocked' || error.message === 'dns' || error.message === 'timeout')) {
        throw error
      }
      return null
    }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location')
      if (!location) return null
      current = new URL(location, current)
      continue
    }
    if (!response.ok) return null
    const type = response.headers.get('content-type') ?? ''
    if (!type.includes('text/html') && !type.includes('application/xhtml') && !type.includes('text/plain')) {
      return null
    }
    return { url: current.toString(), html: await readLimited(response) }
  }
  return null
}

function toPage(fetched: { url: string; html: string }): CrawledPage {
  return {
    url: fetched.url,
    text: htmlToText(fetched.html),
    hrefs: hrefsFrom(fetched.html),
  }
}

/** Fetch the homepage and a few same-site pages. Rejects private and link-local targets. */
export async function crawlWebsite(domain: string): Promise<CrawlResult> {
  const start = new URL(`https://${domain}`)
  let home: { url: string; html: string } | null
  try {
    home = await fetchPage(start)
    if (!home) {
      const www = new URL(`https://www.${domain}`)
      home = await fetchPage(www)
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : ''
    if (reason === 'dns') return { ok: false, error: "We couldn't find that website." }
    if (reason === 'timeout') return { ok: false, error: 'That website took too long to respond.' }
    if (reason === 'blocked') return { ok: false, error: "That address can't be read." }
    return { ok: false, error: "We couldn't open that website." }
  }

  if (!home) return { ok: false, error: "We couldn't open that website." }

  const homePage = toPage(home)
  const extras = collectLinks(home.html, new URL(home.url))
  const more = await Promise.all(
    extras.map(async (url) => {
      try {
        const page = await fetchPage(url)
        return page ? toPage(page) : null
      } catch {
        return null
      }
    }),
  )
  const pages = [homePage, ...more.filter((page): page is CrawledPage => !!page && page.text.length > 0)]
  const corpus = pages
    .map((page) => [page.url, ...page.hrefs, page.text].join('\n'))
    .join('\n')
    .toLowerCase()

  const visible = pages.map((page) => page.text).join(' ').trim()
  if (visible.length < 80) {
    return { ok: false, error: "That page didn't include enough text to read. Add the details yourself." }
  }

  return { ok: true, pages, corpus }
}
