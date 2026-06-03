export function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export function parseUsdToCents(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, '')
  const n = Number.parseFloat(cleaned)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}
