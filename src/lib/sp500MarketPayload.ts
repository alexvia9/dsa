export type Sp500ReturnsPayload = {
  source?: string
  asOf: string
  returns: Record<string, number>
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
