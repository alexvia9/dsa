/**
 * Fetches SPY (S&P 500 ETF) daily close-to-close returns and writes JSON for the
 * teaching simulator. Uses Yahoo Finance server-side — no API key or captcha.
 *
 * Run: npm run update-sp500
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

const YAHOO_USER_AGENT =
  'Mozilla/5.0 (compatible; DSA/1.0; +https://github.com/alexvia9/dsa)'

const SOURCE =
  'https://finance.yahoo.com/quote/SPY — SPY daily (S&P 500 ETF proxy; close-to-close)'

/** @param {unknown} json */
function returnsFromYahooChart(json) {
  if (!json || typeof json !== 'object') return null
  const chart = /** @type {{ chart?: unknown }} */ (json).chart
  if (!chart || typeof chart !== 'object') return null
  const result = /** @type {{ result?: unknown[] }} */ (chart).result?.[0]
  if (!result || typeof result !== 'object') return null

  const timestamps = /** @type {{ timestamp?: number[] }} */ (result).timestamp
  const closes =
    /** @type {{ indicators?: { quote?: { close?: (number|null)[] }[] } }} */ (
      result
    ).indicators?.quote?.[0]?.close
  if (!timestamps?.length || !closes?.length) return null

  /** @type {{ date: string, close: number }[]} */
  const rows = []
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i]
    if (close == null || !Number.isFinite(close) || close <= 0) continue
    const date = new Date(timestamps[i] * 1000).toISOString().slice(0, 10)
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

async function fetchFromYahoo() {
  const period2 = Math.floor(Date.now() / 1000)
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/SPY?period1=1104537600&period2=${period2}&interval=1d`
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': YAHOO_USER_AGENT } })
    if (!res.ok) {
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }
      throw new Error(`Yahoo Finance responded with ${res.status}`)
    }
    const json = await res.json()
    const returns = returnsFromYahooChart(json)
    if (returns) return returns
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
  return null
}

const returns = await fetchFromYahoo()
if (!returns) {
  console.error(
    'Yahoo Finance returned no usable SPY data.\n' +
      'Check network access and try again in a few minutes.',
  )
  process.exit(1)
}

const lastDate = Object.keys(returns).reduce((a, b) => (a > b ? a : b))

mkdirSync(outDirPublic, { recursive: true })
mkdirSync(outDirSrc, { recursive: true })
const payload = { source: SOURCE, asOf: lastDate, returns }

const body = `${JSON.stringify(payload, null, 0)}\n`
writeFileSync(outPathPublic, body, 'utf8')
writeFileSync(outPathSrc, body, 'utf8')
console.log(
  `Wrote ${Object.keys(returns).length} return days, asOf=${lastDate} -> ${outPathPublic} + ${outPathSrc}`,
)
