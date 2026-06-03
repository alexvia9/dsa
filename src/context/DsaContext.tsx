import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { seedState } from '../data/seed'
import { localDateString, toCanonicalLocalYmd } from '../lib/dateLocal'
import { applyGrowthSimulationToState } from '../lib/accountGrowth'
import { setSp500DailyReturns } from '../lib/sp500Market'
import { reconcileBalancesFromDeposits } from '../lib/migrateState'
import { loadState, saveState } from '../lib/storage'
import { fetchDsaState, pushDsaState } from '../lib/supabase/dsaSync'
import type {
  Account,
  DepositRecord,
  DsaState,
  InvestmentStrategy,
  Kid,
  LedgerEntryKind,
} from '../types/dsa'
import { defaultStrategy } from '../types/dsa'
import { normalizeLedgerNote } from '../lib/ledger'

type DsaContextValue = {
  state: DsaState
  /** False while loading the first cloud snapshot after sign-in. */
  remoteHydrated: boolean
  kidById: Map<string, Kid>
  accountById: Map<string, Account>
  accountsForKid: (kidId: string) => Account[]
  depositsForAccount: (accountId: string) => DepositRecord[]
  familyTotalCents: number
  addKid: (name: string) => void
  addAccount: (
    kidId: string,
    name: string,
    opts?: { strategy?: InvestmentStrategy; openingDepositCents?: number },
  ) => string | null
  renameKid: (kidId: string, name: string) => void
  renameAccount: (accountId: string, name: string) => void
  deposit: (
    accountId: string,
    cents: number,
    opts?: {
      recordedAt?: string
      note?: string
      kind?: LedgerEntryKind
    },
  ) => void
  updateDeposit: (
    depositId: string,
    patch: {
      amountCents?: number
      recordedAt?: string
      kind?: LedgerEntryKind
      note?: string | null
    },
  ) => void
  deleteDeposit: (depositId: string) => void
  setStrategy: (accountId: string, strategy: InvestmentStrategy) => void
}

const DsaContext = createContext<DsaContextValue | null>(null)

function emptyDsaState(): DsaState {
  return { kids: [], accounts: [], deposits: [] }
}

function initialLocalState(): DsaState {
  const raw = loadState() ?? seedState()
  return reconcileBalancesFromDeposits(raw)
}

export function DsaProvider({
  children,
  remoteUserId,
}: {
  children: ReactNode
  /** When set, load/save family data via Supabase for this auth user. */
  remoteUserId: string | null
}) {
  const [state, setState] = useState<DsaState>(() =>
    remoteUserId ? emptyDsaState() : initialLocalState(),
  )
  const [hydrated, setHydrated] = useState(remoteUserId === null)

  const remoteHydrated = remoteUserId === null ? true : hydrated

  useEffect(() => {
    if (!remoteUserId) return

    let cancelled = false

    fetchDsaState(remoteUserId)
      .then((remote) => {
        if (cancelled) return
        setState(reconcileBalancesFromDeposits(remote))
        setHydrated(true)
      })
      .catch((err) => {
        console.error('[DSA] Failed to load cloud state', err)
        if (!cancelled) {
          setState(emptyDsaState())
          setHydrated(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [remoteUserId])

  useEffect(() => {
    const url = `${import.meta.env.BASE_URL}market/sp500-daily-returns.json`
    let cancelled = false
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: unknown) => {
        if (cancelled) return
        const ret =
          j &&
          typeof j === 'object' &&
          'returns' in j &&
          j.returns &&
          typeof j.returns === 'object'
            ? (j.returns as Record<string, number>)
            : null
        setSp500DailyReturns(ret)
      })
      .catch(() => {
        // Keep bundled seed data on network/base-URL failure; do not clear returns.
      })
      .finally(() => {
        if (!cancelled) {
          setState((s) => applyGrowthSimulationToState(s))
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!remoteHydrated) return
    let cancelled = false
    const frame = requestAnimationFrame(() => {
      if (!cancelled) {
        setState((s) => applyGrowthSimulationToState(s))
      }
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [remoteHydrated])

  useEffect(() => {
    if (!remoteHydrated || !remoteUserId) return
    let cancelled = false
    const t = setTimeout(() => {
      if (!cancelled) {
        pushDsaState(remoteUserId, state).catch((err) =>
          console.error('[DSA] Supabase sync failed', err),
        )
      }
    }, 650)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [state, remoteHydrated, remoteUserId])

  useEffect(() => {
    if (!remoteHydrated || remoteUserId) return
    saveState(state)
  }, [state, remoteHydrated, remoteUserId])

  const kidById = useMemo(
    () => new Map(state.kids.map((k) => [k.id, k])),
    [state.kids],
  )

  const accountById = useMemo(
    () => new Map(state.accounts.map((a) => [a.id, a])),
    [state.accounts],
  )

  const accountsForKid = useCallback(
    (kidId: string) => state.accounts.filter((a) => a.kidId === kidId),
    [state.accounts],
  )

  const depositsForAccount = useCallback(
    (accountId: string) =>
      state.deposits
        .filter((d) => d.accountId === accountId)
        .slice()
        .sort((a, b) => {
          const byDate = b.recordedAt.localeCompare(a.recordedAt)
          if (byDate !== 0) return byDate
          return b.createdAt.localeCompare(a.createdAt)
        }),
    [state.deposits],
  )

  const familyTotalCents = useMemo(
    () => state.accounts.reduce((s, a) => s + a.balanceCents, 0),
    [state.accounts],
  )

  const addKid = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const kid: Kid = {
      id: crypto.randomUUID(),
      name: trimmed,
      createdAt: new Date().toISOString(),
    }
    setState((s) => ({ ...s, kids: [...s.kids, kid] }))
  }, [])

  const addAccount = useCallback(
    (
      kidId: string,
      name: string,
      opts?: { strategy?: InvestmentStrategy; openingDepositCents?: number },
    ) => {
      const trimmed = name.trim()
      if (!trimmed) return null
      if (!kidById.has(kidId)) return null
      const opening = Math.max(0, Math.round(opts?.openingDepositCents ?? 0))
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      const account: Account = {
        id,
        kidId,
        name: trimmed,
        balanceCents: opening,
        strategy: opts?.strategy ?? defaultStrategy(),
        createdAt: now,
      }
      setState((s) => {
        const deposits = [...s.deposits]
        if (opening > 0) {
          deposits.push({
            id: crypto.randomUUID(),
            accountId: id,
            kind: 'deposit',
            amountCents: opening,
            recordedAt: localDateString(),
            createdAt: now,
          })
        }
        return applyGrowthSimulationToState({
          ...s,
          accounts: [...s.accounts, account],
          deposits,
        })
      })
      return id
    },
    [kidById],
  )

  const renameKid = useCallback((kidId: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setState((s) => ({
      ...s,
      kids: s.kids.map((k) => (k.id === kidId ? { ...k, name: trimmed } : k)),
    }))
  }, [])

  const renameAccount = useCallback((accountId: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setState((s) => ({
      ...s,
      accounts: s.accounts.map((a) =>
        a.id === accountId ? { ...a, name: trimmed } : a,
      ),
    }))
  }, [])

  const deposit = useCallback(
    (
      accountId: string,
      cents: number,
      opts?: {
        recordedAt?: string
        note?: string
        kind?: LedgerEntryKind
      },
    ) => {
      if (!Number.isFinite(cents) || cents <= 0) return
      const rounded = Math.round(cents)
      const raw = opts?.recordedAt?.trim()
      const recordedAt =
        raw && /^\d{4}-\d{1,2}-\d{1,2}$/.test(raw)
          ? toCanonicalLocalYmd(raw)
          : localDateString()
      const kind = opts?.kind === 'withdrawal' ? 'withdrawal' : 'deposit'
      const now = new Date().toISOString()
      const row: DepositRecord = {
        id: crypto.randomUUID(),
        accountId,
        kind,
        amountCents: rounded,
        note: normalizeLedgerNote(opts?.note),
        recordedAt,
        createdAt: now,
      }
      setState((s) =>
        applyGrowthSimulationToState({
          ...s,
          deposits: [...s.deposits, row],
        }),
      )
    },
    [],
  )

  const updateDeposit = useCallback(
    (
      depositId: string,
      patch: {
        amountCents?: number
        recordedAt?: string
        kind?: LedgerEntryKind
        note?: string | null
      },
    ) => {
      setState((s) => {
        const idx = s.deposits.findIndex((d) => d.id === depositId)
        if (idx === -1) return s
        const prev = s.deposits[idx]
        const nextAmount =
          patch.amountCents !== undefined
            ? Math.round(patch.amountCents)
            : prev.amountCents
        const nextDateRaw =
          patch.recordedAt !== undefined
            ? patch.recordedAt.trim()
            : prev.recordedAt
        const nextKind =
          patch.kind !== undefined ? patch.kind : prev.kind
        if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(nextDateRaw)) return s
        const nextDate = toCanonicalLocalYmd(nextDateRaw)
        if (!Number.isFinite(nextAmount) || nextAmount <= 0) return s
        if (nextKind !== 'deposit' && nextKind !== 'withdrawal') return s

        let nextNote = prev.note
        if (patch.note !== undefined) {
          nextNote =
            patch.note === null || patch.note === ''
              ? undefined
              : normalizeLedgerNote(patch.note)
        }

        const deposits = s.deposits.map((d, i) =>
          i === idx
            ? {
                ...d,
                amountCents: nextAmount,
                recordedAt: nextDate,
                kind: nextKind,
                note: nextNote,
              }
            : d,
        )
        return applyGrowthSimulationToState({ ...s, deposits })
      })
    },
    [],
  )

  const deleteDeposit = useCallback((depositId: string) => {
    setState((s) => {
      const prev = s.deposits.find((d) => d.id === depositId)
      if (!prev) return s
      return applyGrowthSimulationToState({
        ...s,
        deposits: s.deposits.filter((d) => d.id !== depositId),
      })
    })
  }, [])

  const setStrategy = useCallback(
    (accountId: string, strategy: InvestmentStrategy) => {
      setState((s) =>
        applyGrowthSimulationToState({
          ...s,
          accounts: s.accounts.map((a) =>
            a.id === accountId ? { ...a, strategy } : a,
          ),
        }),
      )
    },
    [],
  )

  const value = useMemo(
    () => ({
      state,
      remoteHydrated,
      kidById,
      accountById,
      accountsForKid,
      depositsForAccount,
      familyTotalCents,
      addKid,
      addAccount,
      renameKid,
      renameAccount,
      deposit,
      updateDeposit,
      deleteDeposit,
      setStrategy,
    }),
    [
      state,
      remoteHydrated,
      kidById,
      accountById,
      accountsForKid,
      depositsForAccount,
      familyTotalCents,
      addKid,
      addAccount,
      renameKid,
      renameAccount,
      deposit,
      updateDeposit,
      deleteDeposit,
      setStrategy,
    ],
  )

  return <DsaContext.Provider value={value}>{children}</DsaContext.Provider>
}

/** Hook colocated with provider (fast-refresh prefers single export per file). */
// eslint-disable-next-line react-refresh/only-export-components
export function useDsa(): DsaContextValue {
  const ctx = useContext(DsaContext)
  if (!ctx) throw new Error('useDsa must be used within DsaProvider')
  return ctx
}
