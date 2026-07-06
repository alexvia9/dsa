import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const fetchUserAgent =
  'Mozilla/5.0 (compatible; DSA/1.0; +https://github.com/alexvia9/dsa)'

const SOURCE =
  'https://finance.yahoo.com/quote/SPY — SPY daily (S&P 500 ETF proxy; close-to-close)'

function returnsFromYahooChart(json: unknown): Record<string, number> | null {
  if (!json || typeof json !== 'object') return null
  const chart = (json as { chart?: unknown }).chart
  if (!chart || typeof chart !== 'object') return null
  const result = (chart as { result?: unknown[] }).result?.[0]
  if (!result || typeof result !== 'object') return null

  const timestamps = (result as { timestamp?: number[] }).timestamp
  const closes = (result as { indicators?: { quote?: { close?: (number | null)[] }[] } })
    .indicators?.quote?.[0]?.close
  if (!timestamps?.length || !closes?.length) return null

  const rows: { date: string; close: number }[] = []
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i]
    if (close == null || !Number.isFinite(close) || close <= 0) continue
    const date = new Date(timestamps[i] * 1000).toISOString().slice(0, 10)
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const period2 = Math.floor(Date.now() / 1000)
  const yahooUrl = `https://query2.finance.yahoo.com/v8/finance/chart/SPY?period1=1104537600&period2=${period2}&interval=1d`

  try {
    const upstream = await fetch(yahooUrl, {
      headers: { 'User-Agent': fetchUserAgent },
    })
    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `Yahoo Finance responded with ${upstream.status}` }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const json: unknown = await upstream.json()
    const returns = returnsFromYahooChart(json)
    if (!returns) {
      return new Response(
        JSON.stringify({ error: 'Yahoo Finance chart could not be parsed.' }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const asOf = Object.keys(returns).reduce((a, b) => (a > b ? a : b))
    const body = JSON.stringify({ source: SOURCE, asOf, returns })

    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
