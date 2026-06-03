import type { DepositRecord, DsaState, Kid } from '../types/dsa'
import { applyGrowthSimulationToState } from './accountGrowth'
import { toCanonicalLocalYmd } from './dateLocal'
import { normalizeAvatarColorId } from './kidAvatarColors'
import { normalizeLedgerNote } from './ledger'

export function normalizeDepositRecord(raw: unknown): DepositRecord {
  const r = raw && typeof raw === 'object' ? (raw as Partial<DepositRecord>) : {}
  const kind = r.kind === 'withdrawal' ? 'withdrawal' : 'deposit'
  const amountCents = Math.max(0, Math.round(Number(r.amountCents) || 0))
  return {
    id: typeof r.id === 'string' && r.id ? r.id : crypto.randomUUID(),
    accountId: typeof r.accountId === 'string' ? r.accountId : '',
    kind,
    amountCents,
    note: normalizeLedgerNote(
      typeof r.note === 'string' ? r.note : undefined,
    ),
    recordedAt:
      typeof r.recordedAt === 'string' && r.recordedAt
        ? toCanonicalLocalYmd(r.recordedAt)
        : '',
    createdAt:
      typeof r.createdAt === 'string' && r.createdAt
        ? r.createdAt
        : new Date().toISOString(),
  }
}

function normalizeKid(raw: unknown, index: number): Kid {
  const r = raw && typeof raw === 'object' ? (raw as Partial<Kid>) : {}
  return {
    id: typeof r.id === 'string' && r.id ? r.id : crypto.randomUUID(),
    name: typeof r.name === 'string' ? r.name.trim() : '',
    avatarColor: normalizeAvatarColorId(r.avatarColor, index),
    createdAt:
      typeof r.createdAt === 'string' && r.createdAt
        ? r.createdAt
        : new Date().toISOString(),
  }
}

function normalizeDsaState(state: DsaState): DsaState {
  return {
    ...state,
    kids: state.kids.map((k, i) => normalizeKid(k, i)),
    deposits: state.deposits.map((d) => normalizeDepositRecord(d)),
  }
}

/** v1 had no `deposits`; synthesize one row per positive balance. */
export function migrateV1ToV2(parsed: unknown): DsaState | null {
  if (!parsed || typeof parsed !== 'object') return null
  const o = parsed as Partial<DsaState>
  if (!Array.isArray(o.kids) || !Array.isArray(o.accounts)) return null
  if (Object.prototype.hasOwnProperty.call(o, 'deposits')) {
    const d = (o as { deposits?: unknown }).deposits
    if (Array.isArray(d)) {
      return reconcileBalancesFromDeposits({
        kids: o.kids,
        accounts: o.accounts,
        deposits: d.map((row) => normalizeDepositRecord(row)),
      })
    }
  }

  const deposits: DepositRecord[] = []
  const now = new Date().toISOString()
  for (const a of o.accounts) {
    if (a.balanceCents > 0) {
      const recorded =
        typeof a.createdAt === 'string' && a.createdAt.length >= 10
          ? a.createdAt.slice(0, 10)
          : now.slice(0, 10)
      deposits.push({
        id: crypto.randomUUID(),
        accountId: a.id,
        kind: 'deposit',
        amountCents: a.balanceCents,
        recordedAt: recorded,
        createdAt: now,
      })
    }
  }
  return reconcileBalancesFromDeposits({
    kids: o.kids,
    accounts: o.accounts,
    deposits,
  })
}

/** Set each account balance from ledger + growth simulation (through today). */
export function reconcileBalancesFromDeposits(state: DsaState): DsaState {
  return applyGrowthSimulationToState(normalizeDsaState(state))
}
