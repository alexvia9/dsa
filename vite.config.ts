import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import {
  resolveStooqSpyCsvUrl,
  sp500AsOfFromReturns,
  sp500ReturnsFromStooqCsv,
} from './src/lib/sp500Stooq'

// GitHub Pages project site: https://alexvia9.github.io/dsa/
const repoBase = '/dsa/'

function stooqDevMarketProxy(
  stooqCsvUrl: string | undefined,
  configured: boolean,
): Plugin {
  return {
    name: 'stooq-dev-market-proxy',
    configureServer(server) {
      server.middlewares.use('/api/market/spy-returns', async (_req, res) => {
        if (!configured || !stooqCsvUrl) {
          res.statusCode = 503
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error:
                'Stooq is not configured. Add STOOQ_SPY_CSV_URL or STOOQ_API_KEY to .env (or .env.local) — see .env.example.',
            }),
          )
          return
        }

        try {
          const upstream = await fetch(stooqCsvUrl)
          if (!upstream.ok) {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({ error: `Stooq responded with ${upstream.status}` }),
            )
            return
          }

          const csv = await upstream.text()
          const returns = sp500ReturnsFromStooqCsv(csv)
          if (!returns) {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: 'Stooq CSV could not be parsed (check your Stooq URL/key).',
              }),
            )
            return
          }

          const asOf = sp500AsOfFromReturns(returns)
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              source:
                'https://stooq.com — SPY.US daily (S&P 500 ETF proxy; close-to-close)',
              asOf,
              returns,
            }),
          )
        } catch (err) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: String(err) }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const stooqCsvUrl = resolveStooqSpyCsvUrl({
    csvUrl: env.STOOQ_SPY_CSV_URL,
    apikey: env.STOOQ_API_KEY,
  })
  const stooqConfigured = Boolean(
    env.STOOQ_SPY_CSV_URL?.trim() || env.STOOQ_API_KEY?.trim(),
  )

  return {
    base: mode === 'production' ? repoBase : '/',
    plugins: [react(), stooqDevMarketProxy(stooqCsvUrl ?? undefined, stooqConfigured)],
  }
})
