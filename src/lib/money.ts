export function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

/** Currency with an explicit plus on gains. Zero and losses stay as `formatUsd`. */
export function formatUsdSigned(cents: number): string {
  const text = formatUsd(cents)
  return cents > 0 ? `+${text}` : text
}

export function parseUsdToCents(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, '')
  const n = Number.parseFloat(cleaned)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}
