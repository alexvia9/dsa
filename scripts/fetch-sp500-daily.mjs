/**
 * Fetches free daily SPY (S&P 500 ETF) prices from Stooq and writes
 * close-to-close daily returns as JSON for the simulator.
 *
 * Run: node scripts/fetch-sp500-daily.mjs
 * No API key required.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDirPublic = join(root, 'public/market')
const outPathPublic = join(outDirPublic, 'sp500-daily-returns.json')
const outDirSrc = join(root, 'src/data')
const outPathSrc = join(outDirSrc, 'sp500-daily-returns.json')

const STOOQ_URL = 'https://stooq.com/q/d/l/?s=spy.us&i=d'

const text = await fetch(STOOQ_URL).then((r) => r.text())
const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

if (lines.length < 2 || lines[0].includes('No data')) {
  console.error('Stooq returned no usable data')
  process.exit(1)
}

const header = lines[0].toLowerCase()
if (!header.startsWith('date')) {
  console.error('Unexpected CSV header:', lines[0])
  process.exit(1)
}

/** @type {{ date: string, close: number }[]} */
const rows = []
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',')
  if (parts.length < 5) continue
  const date = parts[0]
  const close = Number.parseFloat(parts[4])
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(close) || close <= 0)
    continue
  rows.push({ date, close })
}

rows.sort((a, b) => a.date.localeCompare(b.date))

/** @type {Record<string, number>} */
const returns = {}
let prevClose = null
let lastDate = ''
for (const { date, close } of rows) {
  lastDate = date
  if (prevClose !== null && prevClose > 0) {
    returns[date] = close / prevClose - 1
  }
  prevClose = close
}

mkdirSync(outDirPublic, { recursive: true })
mkdirSync(outDirSrc, { recursive: true })
const payload = {
  source: 'https://stooq.com — SPY.US daily (S&P 500 ETF proxy; close-to-close)',
  asOf: lastDate,
  returns,
}

const body = `${JSON.stringify(payload, null, 0)}\n`
writeFileSync(outPathPublic, body, 'utf8')
writeFileSync(outPathSrc, body, 'utf8')
console.log(
  `Wrote ${Object.keys(returns).length} return days, asOf=${lastDate} -> ${outPathPublic} + ${outPathSrc}`,
)
