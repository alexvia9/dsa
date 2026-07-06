/** Parse Yahoo Finance chart JSON into close-to-close daily returns (YYYY-MM-DD keys). */
export function sp500ReturnsFromYahooChart(json: unknown): Record<string, number> {
  if (!json || typeof json !== 'object') return {}
  const chart = (json as { chart?: unknown }).chart
  if (!chart || typeof chart !== 'object') return {}
  const results = (chart as { result?: unknown[] }).result
  const result = results?.[0]
  if (!result || typeof result !== 'object') return {}

  const timestamps = (result as { timestamp?: number[] }).timestamp
  const closes = (result as { indicators?: { quote?: { close?: (number | null)[] }[] } })
    .indicators?.quote?.[0]?.close
  if (!timestamps?.length || !closes?.length) return {}

  const rows: { date: string; close: number }[] = []
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i]
    if (close == null || !Number.isFinite(close) || close <= 0) continue
    const date = new Date(timestamps[i] * 1000).toISOString().slice(0, 10)
    rows.push({ date, close })
  }
  if (rows.length === 0) return {}
  rows.sort((a, b) => a.date.localeCompare(b.date))

  const returns: Record<string, number> = {}
  let prevClose: number | null = null
  for (const { date, close } of rows) {
    if (prevClose !== null && prevClose > 0) {
      returns[date] = close / prevClose - 1
    }
    prevClose = close
  }
  return returns
}

export const SP500_YAHOO_SOURCE =
  'https://finance.yahoo.com/quote/SPY — SPY daily (S&P 500 ETF proxy; close-to-close)'

/** Yahoo chart URL for full SPY history through today (server-side only). */
export function sp500YahooChartUrl(period2Sec = Math.floor(Date.now() / 1000)): string {
  return `https://query2.finance.yahoo.com/v8/finance/chart/SPY?period1=1104537600&period2=${period2Sec}&interval=1d`
}
