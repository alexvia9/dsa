import { getSupabase, isSupabaseConfigured } from './supabaseClient'
import { mergeSp500DailyReturns, sp500MarketAsOf } from './sp500Market'
import { sp500ReturnsPayloadFromJson } from './sp500Stooq'

async function fetchPublicSp500Json(): Promise<Record<string, number> | null> {
  const url = `${import.meta.env.BASE_URL}market/sp500-daily-returns.json?v=${Date.now()}`
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const json: unknown = await res.json()
    return sp500ReturnsPayloadFromJson(json)?.returns ?? null
  } catch {
    return null
  }
}

async function fetchLiveSp500FromDevProxy(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch('/api/market/spy-returns', { cache: 'no-store' })
    if (!res.ok) return null
    const json: unknown = await res.json()
    return sp500ReturnsPayloadFromJson(json)?.returns ?? null
  } catch {
    return null
  }
}

async function fetchLiveSp500FromSupabase(): Promise<Record<string, number> | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = getSupabase()
  if (!supabase) return null
  try {
    const { data, error } = await supabase.functions.invoke('market-spy-returns', {
      method: 'GET',
    })
    if (error) return null
    return sp500ReturnsPayloadFromJson(data)?.returns ?? null
  } catch {
    return null
  }
}

export type RefreshSp500Result = {
  asOf: string | null
  /** True when live Stooq data was merged (edge fn or dev proxy). */
  live: boolean
}

/**
 * Pull the newest SPY daily returns we can reach, merge into the in-memory
 * teaching simulator, and return the latest date key.
 */
export async function refreshSp500MarketData(opts?: {
  /** Attempt Supabase edge fn (prod) or Vite dev proxy before static JSON only. */
  tryLive?: boolean
}): Promise<RefreshSp500Result> {
  let live = false

  if (opts?.tryLive) {
    const liveReturns =
      (await fetchLiveSp500FromSupabase()) ??
      (import.meta.env.DEV ? await fetchLiveSp500FromDevProxy() : null)
    if (liveReturns) {
      mergeSp500DailyReturns(liveReturns)
      live = true
    }
  }

  const staticReturns = await fetchPublicSp500Json()
  if (staticReturns) {
    mergeSp500DailyReturns(staticReturns)
  }

  return { asOf: sp500MarketAsOf(), live }
}

export function stateHasStockMarketAccount(
  accounts: { strategy: { mode: string } }[],
): boolean {
  return accounts.some((a) => a.strategy.mode === 'stock_market')
}
