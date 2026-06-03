import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const fetchUserAgent =
  'Mozilla/5.0 (compatible; DSA/1.0; +https://github.com/alexvia9/dsa)'

function returnsFromStooqCsv(csv: string): Record<string, number> | null {
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (
    lines.length < 2 ||
    lines[0].includes('No data') ||
    /apikey/i.test(lines[0])
  ) {
    return null
  }
  if (!lines[0].toLowerCase().startsWith('date')) return null

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const csvUrl = Deno.env.get('STOOQ_SPY_CSV_URL')?.trim()
  const apikey = Deno.env.get('STOOQ_API_KEY')?.trim()
  let stooqFetchUrl: string | null = null
  if (csvUrl && /apikey=/i.test(csvUrl)) {
    stooqFetchUrl = csvUrl
  } else if (csvUrl) {
    try {
      const key = new URL(csvUrl).searchParams.get('apikey')?.trim()
      if (key) {
        stooqFetchUrl = `https://stooq.com/q/d/l/?s=spy.us&i=d&apikey=${encodeURIComponent(key)}`
      }
    } catch {
      /* ignore */
    }
  } else if (apikey) {
    stooqFetchUrl = `https://stooq.com/q/d/l/?s=spy.us&i=d&apikey=${encodeURIComponent(apikey)}`
  }

  if (!stooqFetchUrl) {
    return new Response(
      JSON.stringify({
        error:
          'Configure STOOQ_SPY_CSV_URL or STOOQ_API_KEY on the edge function (run npm run stooq-setup).',
      }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  try {
    const upstream = await fetch(stooqFetchUrl, {
      headers: { 'User-Agent': fetchUserAgent },
    })
    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `Stooq responded with ${upstream.status}` }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const csv = await upstream.text()
    const returns = returnsFromStooqCsv(csv)
    if (!returns) {
      return new Response(
        JSON.stringify({ error: 'Stooq CSV could not be parsed (check apikey).' }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const asOf = Object.keys(returns).reduce((a, b) => (a > b ? a : b))
    const body = JSON.stringify({
      source:
        'https://stooq.com — SPY.US daily (S&P 500 ETF proxy; close-to-close)',
      asOf,
      returns,
    })

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
