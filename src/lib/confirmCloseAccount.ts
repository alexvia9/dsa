import type { Account } from '../types/dsa'
import { formatUsd } from './money'

export function confirmCloseAccount(
  account: Pick<Account, 'name' | 'balanceCents'>,
  kidName?: string,
): boolean {
  const who = kidName ? `${kidName}'s ` : ''
  const balance = formatUsd(account.balanceCents)
  return window.confirm(
    `Close ${who}account “${account.name}”?\n\n` +
      `Current balance: ${balance}. All deposits, withdrawals, and history for this account will be removed. This cannot be undone.`,
  )
}
