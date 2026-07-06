import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { sp500AsOfFromReturns } from './src/lib/sp500MarketPayload'
import {
  SP500_YAHOO_SOURCE,
  sp500ReturnsFromYahooChart,
  sp500YahooChartUrl,
} from './src/lib/sp500Yahoo'

// GitHub Pages project site: https://alexvia9.github.io/dsa/
const repoBase = '/dsa/'

const YAHOO_USER_AGENT =
  'Mozilla/5.0 (compatible; DSA/1.0; +https://github.com/alexvia9/dsa)'

function yahooDevMarketProxy(): Plugin {
  return {
    name: 'yahoo-dev-market-proxy',
    configureServer(server) {
      server.middlewares.use('/api/market/spy-returns', async (_req, res) => {
        try {
          const upstream = await fetch(sp500YahooChartUrl(), {
            headers: { 'User-Agent': YAHOO_USER_AGENT },
          })
          if (!upstream.ok) {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({ error: `Yahoo Finance responded with ${upstream.status}` }),
            )
            return
          }

          const json: unknown = await upstream.json()
          const returns = sp500ReturnsFromYahooChart(json)
          if (!returns || Object.keys(returns).length === 0) {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: 'Yahoo Finance chart could not be parsed.',
              }),
            )
            return
          }

          const asOf = sp500AsOfFromReturns(returns)
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              source: SP500_YAHOO_SOURCE,
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
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? repoBase : '/',
  plugins: [react(), yahooDevMarketProxy()],
}))
