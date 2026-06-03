/**
 * How an account grows in the simulator (teaching model). UX copy and labels for
 * each `mode` live in `lib/accountTypeCatalog.ts`; this type stays the behavioral contract.
 */
export type InvestmentStrategy =
  | {
      mode: 'stock_market'
      /** Optional short label for display; simulation does not use it yet */
      benchmarkSymbol: string
    }
  | {
      mode: 'savings_apr'
      /** Annual percentage rate (e.g. 4.5 = 4.5% / year), typical savings style */
      annualRatePercent: number
    }
  | {
      mode: 'monthly_end_compound'
      /** YYYY-MM → percent applied once at that month’s end on the balance */
      monthlyRatePercentByMonth: Record<string, number>
    }
  | {
      /** Cash jar: balance only changes with deposits and withdrawals (no yield). */
      mode: 'piggy_bank'
    }

import type { KidAvatarColorId } from '../lib/kidAvatarColors'

export type Kid = {
  id: string
  name: string
  avatarColor: KidAvatarColorId
  createdAt: string
}

export type Account = {
  id: string
  kidId: string
  name: string
  /** Sum of deposit records; updated whenever deposits change */
  balanceCents: number
  strategy: InvestmentStrategy
  createdAt: string
}

export type LedgerEntryKind = 'deposit' | 'withdrawal'

/** Money in or out on an account (deposits, withdrawals); optional note for context. */
export type DepositRecord = {
  id: string
  accountId: string
  kind: LedgerEntryKind
  /** Positive magnitude in cents (withdrawals use kind + this amount). */
  amountCents: number
  /** Optional context, e.g. “Tooth Fairy”, “Birthday gift”. */
  note?: string
  /** Calendar date the entry is recorded for (YYYY-MM-DD) */
  recordedAt: string
  /** When this row was created in the app (ISO) */
  createdAt: string
}

export type DsaState = {
  kids: Kid[]
  accounts: Account[]
  deposits: DepositRecord[]
}

export function defaultStrategy(): InvestmentStrategy {
  return {
    mode: 'savings_apr',
    annualRatePercent: 3,
  }
}
