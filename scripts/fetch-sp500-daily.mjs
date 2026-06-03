/**
 * Fetches SPY (S&P 500 ETF) daily close-to-close returns from Stooq and writes
 * JSON for the teaching simulator.
 *
 * Stooq has no API signup page. After a captcha on their site you copy either:
 *   - the full CSV download URL → STOOQ_SPY_CSV_URL
 *   - or just the apikey= value     → STOOQ_API_KEY
 *
 * Run: npm run update-sp500
 * Help: npm run stooq-setup
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFiles } from './loadEnvFiles.mjs'

loadEnvFiles(join(dirname(fileURLToPath(import.meta.url)), '..'))

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDirPublic = join(root, 'public/market')
const outPathPublic = join(outDirPublic, 'sp500-daily-returns.json')
const outDirSrc = join(root, 'src/data')
const outPathSrc = join(outDirSrc, 'sp500-daily-returns.json')

const FETCH_USER_AGENT =
  'Mozilla/5.0 (compatible; DSA/1.0; +https://github.com/alexvia9/dsa)'

/** @param {string} csv */
function returnsFromStooqCsv(csv) {
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

  /** @type {{ date: string, close: number }[]} */
  const rows = []
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

  /** @type {Record<string, number>} */
  const returns = {}
  let prevClose = null
  for (const { date, close } of rows) {
    if (prevClose !== null && prevClose > 0) {
      returns[date] = close / prevClose - 1
    }
    prevClose = close
  }
  return Object.keys(returns).length > 0 ? returns : null
}

/** @param {{ csvUrl?: string, apikey?: string }} opts */
function resolveStooqSpyCsvUrl(opts) {
  const csvUrl = opts.csvUrl?.trim()
  if (csvUrl && /apikey=/i.test(csvUrl)) return csvUrl
  if (csvUrl) {
    try {
      const key = new URL(csvUrl).searchParams.get('apikey')?.trim()
      if (key) {
        return `https://stooq.com/q/d/l/?s=spy.us&i=d&apikey=${encodeURIComponent(key)}`
      }
    } catch {
      /* ignore */
    }
  }
  const apikey = opts.apikey?.trim()
  if (apikey) {
    return `https://stooq.com/q/d/l/?s=spy.us&i=d&apikey=${encodeURIComponent(apikey)}`
  }
  return null
}

const stooqUrl = resolveStooqSpyCsvUrl({
  csvUrl: process.env.STOOQ_SPY_CSV_URL,
  apikey: process.env.STOOQ_API_KEY,
})

if (!stooqUrl) {
  console.error(
    'Stooq is not configured.\n\n' +
      'Run: npm run stooq-setup\n' +
      'Then set STOOQ_SPY_CSV_URL or STOOQ_API_KEY and run this script again.',
  )
  process.exit(1)
}

const text = await fetch(stooqUrl, {
  headers: { 'User-Agent': FETCH_USER_AGENT },
}).then((r) => r.text())

const returns = returnsFromStooqCsv(text)
if (!returns) {
  console.error(
    'Stooq returned no usable SPY data.\n' +
      'Your link or key may have expired — complete the captcha again on stooq.com and copy a fresh download URL.',
  )
  process.exit(1)
}

const lastDate = Object.keys(returns).reduce((a, b) => (a > b ? a : b))
const source =
  'https://stooq.com — SPY.US daily (S&P 500 ETF proxy; close-to-close)'

mkdirSync(outDirPublic, { recursive: true })
mkdirSync(outDirSrc, { recursive: true })
const payload = { source, asOf: lastDate, returns }

const body = `${JSON.stringify(payload, null, 0)}\n`
writeFileSync(outPathPublic, body, 'utf8')
writeFileSync(outPathSrc, body, 'utf8')
console.log(
  `Wrote ${Object.keys(returns).length} return days, asOf=${lastDate} -> ${outPathPublic} + ${outPathSrc}`,
)
