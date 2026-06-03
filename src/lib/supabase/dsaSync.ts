import type {
  Account,
  DepositRecord,
  DsaState,
  InvestmentStrategy,
  Kid,
} from '../../types/dsa'
import { normalizeAvatarColorId } from '../kidAvatarColors'
import { getSupabase } from '../supabaseClient'

type KidRow = {
  id: string
  user_id: string
  name: string
  avatar_color: string | null
  created_at: string
}

type AccountRow = {
  id: string
  user_id: string
  kid_id: string
  name: string
  balance_cents: number
  strategy: unknown
  created_at: string
}

type LedgerRow = {
  id: string
  user_id: string
  account_id: string
  kind: 'deposit' | 'withdrawal'
  amount_cents: number
  note: string | null
  recorded_at: string
  created_at: string
}

function rowToKid(r: KidRow, index: number): Kid {
  return {
    id: r.id,
    name: r.name,
    avatarColor: normalizeAvatarColorId(r.avatar_color, index),
    createdAt: r.created_at,
  }
}

function rowToAccount(r: AccountRow): Account {
  return {
    id: r.id,
    kidId: r.kid_id,
    name: r.name,
    balanceCents: r.balance_cents,
    strategy: r.strategy as InvestmentStrategy,
    createdAt: r.created_at,
  }
}

function rowToDeposit(r: LedgerRow): DepositRecord {
  return {
    id: r.id,
    accountId: r.account_id,
    kind: r.kind,
    amountCents: r.amount_cents,
    note: r.note ?? undefined,
    recordedAt: r.recorded_at,
    createdAt: r.created_at,
  }
}

const EMPTY: DsaState = { kids: [], accounts: [], deposits: [] }

/** Load all family data for the signed-in user. */
export async function fetchDsaState(userId: string): Promise<DsaState> {
  const supabase = getSupabase()
  if (!supabase) return EMPTY

  const [kidsRes, accountsRes, ledgerRes] = await Promise.all([
    supabase.from('dsa_kids').select('*').eq('user_id', userId),
    supabase.from('dsa_accounts').select('*').eq('user_id', userId),
    supabase.from('dsa_ledger_entries').select('*').eq('user_id', userId),
  ])

  if (kidsRes.error) throw kidsRes.error
  if (accountsRes.error) throw accountsRes.error
  if (ledgerRes.error) throw ledgerRes.error

  const kids = (kidsRes.data as KidRow[]).map((r, i) => rowToKid(r, i))
  const accounts = (accountsRes.data as AccountRow[]).map(rowToAccount)
  const deposits = (ledgerRes.data as LedgerRow[]).map(rowToDeposit)

  return { kids, accounts, deposits }
}

/** Remove remote rows for this user that are no longer in local state. */
async function deleteOrphans(
  table: 'dsa_ledger_entries' | 'dsa_accounts' | 'dsa_kids',
  userId: string,
  keepIds: Set<string>,
): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return

  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('user_id', userId)

  if (error) throw error

  const orphanIds = (data ?? [])
    .map((row) => row.id as string)
    .filter((id) => !keepIds.has(id))

  if (orphanIds.length === 0) return

  const { error: delErr } = await supabase
    .from(table)
    .delete()
    .eq('user_id', userId)
    .in('id', orphanIds)

  if (delErr) throw delErr
}

/**
 * Upsert local rows, then delete only rows that were removed locally.
 * Writes always run before deletes so a failed upsert cannot wipe remote data.
 */
export async function pushDsaState(userId: string, state: DsaState): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return

  if (state.kids.length > 0) {
    const { error } = await supabase.from('dsa_kids').upsert(
      state.kids.map((k) => ({
        id: k.id,
        user_id: userId,
        name: k.name,
        avatar_color: k.avatarColor,
        created_at: k.createdAt,
      })),
      { onConflict: 'id' },
    )
    if (error) throw error
  }

  if (state.accounts.length > 0) {
    const { error } = await supabase.from('dsa_accounts').upsert(
      state.accounts.map((a) => ({
        id: a.id,
        user_id: userId,
        kid_id: a.kidId,
        name: a.name,
        balance_cents: a.balanceCents,
        strategy: a.strategy,
        created_at: a.createdAt,
      })),
      { onConflict: 'id' },
    )
    if (error) throw error
  }

  if (state.deposits.length > 0) {
    const { error } = await supabase.from('dsa_ledger_entries').upsert(
      state.deposits.map((d) => ({
        id: d.id,
        user_id: userId,
        account_id: d.accountId,
        kind: d.kind,
        amount_cents: d.amountCents,
        note: d.note ?? null,
        recorded_at: d.recordedAt,
        created_at: d.createdAt,
      })),
      { onConflict: 'id' },
    )
    if (error) throw error
  }

  const keepKids = new Set(state.kids.map((k) => k.id))
  const keepAccounts = new Set(state.accounts.map((a) => a.id))
  const keepDeposits = new Set(state.deposits.map((d) => d.id))

  await deleteOrphans('dsa_ledger_entries', userId, keepDeposits)
  await deleteOrphans('dsa_accounts', userId, keepAccounts)
  await deleteOrphans('dsa_kids', userId, keepKids)
}
