import type { Kid } from '../types/dsa'
import { formatUsd } from './money'

export function confirmCloseChild(
  kid: Pick<Kid, 'name'>,
  accountCount: number,
  totalBalanceCents: number,
): boolean {
  const accountsLabel =
    accountCount === 1 ? '1 account' : `${accountCount} accounts`
  return window.confirm(
    `Remove ${kid.name} from your family?\n\n` +
      `${accountsLabel}, combined balance ${formatUsd(totalBalanceCents)}. ` +
      `All of this child’s accounts and history will be deleted. This cannot be undone.`,
  )
}
