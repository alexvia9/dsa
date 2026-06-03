export type Sp500ReturnsPayload = {
  source?: string
  asOf: string
  returns: Record<string, number>
}

const STOOQ_CSV_BASE = 'https://stooq.com/q/d/l/?s=spy.us&i=d'

/** Build the Stooq SPY daily CSV URL (server-side only — never expose apikey in the client). */
export function stooqSpyCsvUrl(apikey: string): string {
  return `${STOOQ_CSV_BASE}&apikey=${encodeURIComponent(apikey)}`
}

/** Pull `apikey` from a Stooq CSV download URL copied in the browser. */
export function extractStooqApikeyFromUrl(url: string): string | null {
  try {
    const key = new URL(url.trim()).searchParams.get('apikey')?.trim()
    return key || null
  } catch {
    return null
  }
}

/**
 * Resolve the Stooq CSV URL from env-style config.
 * Prefer STOOQ_SPY_CSV_URL (full link after captcha) over a bare STOOQ_API_KEY.
 */
export function resolveStooqSpyCsvUrl(opts: {
  csvUrl?: string | null
  apikey?: string | null
}): string | null {
  const csvUrl = opts.csvUrl?.trim()
  if (csvUrl) {
    if (/apikey=/i.test(csvUrl)) return csvUrl
    const fromUrl = extractStooqApikeyFromUrl(csvUrl)
    if (fromUrl) return stooqSpyCsvUrl(fromUrl)
  }
  const apikey = opts.apikey?.trim()
  if (apikey) return stooqSpyCsvUrl(apikey)
  return null
}

/** Parse Stooq SPY CSV into close-to-close daily returns (YYYY-MM-DD keys). */
export function sp500ReturnsFromStooqCsv(csv: string): Record<string, number> | null {
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (
    lines.length < 2 ||
    lines[0].includes('No data') ||
    /apikey/i.test(lines[0])
  ) {
    return null
  }
  const header = lines[0].toLowerCase()
  if (!header.startsWith('date')) return null

  const rows: { date: string; close: number }[] = []
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',')
    if (parts.length < 5) continue
    const date = parts[0]
    const close = Number.parseFloat(parts[4])
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(close) || close <= 0) {
      continue
    }
    rows.push({ date, close })
  }
  if (rows.length === 0) return null
  rows.sort((a, b) => a.date.localeCompare(b.date))

  const returns: Record<string, number> = {}
  let prevClose: number | null = null
  for (const { date, close } of rows) {
    if (prevClose !== null && prevClose > 0) {
      returns[date] = close / prevClose - 1
    }
    prevClose = close
  }
  return Object.keys(returns).length > 0 ? returns : null
}

export function sp500AsOfFromReturns(returns: Record<string, number>): string | null {
  const keys = Object.keys(returns)
  if (keys.length === 0) return null
  return keys.reduce((a, b) => (a > b ? a : b))
}

/** Parse `{ asOf, returns }` JSON from the edge function, dev proxy, or static file. */
export function sp500ReturnsPayloadFromJson(
  json: unknown,
): Sp500ReturnsPayload | null {
  if (!json || typeof json !== 'object') return null
  const returns = (json as { returns?: unknown }).returns
  if (!returns || typeof returns !== 'object') return null
  const map = returns as Record<string, number>
  if (Object.keys(map).length === 0) return null
  const asOf =
    typeof (json as { asOf?: unknown }).asOf === 'string'
      ? (json as { asOf: string }).asOf
      : sp500AsOfFromReturns(map)
  if (!asOf) return null
  const source =
    typeof (json as { source?: unknown }).source === 'string'
      ? (json as { source: string }).source
      : undefined
  return { source, asOf, returns: map }
}
