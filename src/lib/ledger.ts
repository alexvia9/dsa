import type { DepositRecord } from '../types/dsa'

export function signedLedgerAmountCents(entry: DepositRecord): number {
  return entry.kind === 'withdrawal' ? -entry.amountCents : entry.amountCents
}

export function normalizeLedgerNote(s: string | undefined): string | undefined {
  const t = s?.trim()
  if (!t) return undefined
  return t.slice(0, 500)
}

export function sumNetLedgerCents(entries: DepositRecord[]): number {
  return entries.reduce((s, d) => s + signedLedgerAmountCents(d), 0)
}
