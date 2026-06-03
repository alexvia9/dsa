import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { seedState } from '../data/seed'
import { localDateString, toCanonicalLocalYmd } from '../lib/dateLocal'
import { applyGrowthSimulationToState } from '../lib/accountGrowth'
import {
  refreshSp500MarketData,
} from '../lib/refreshSp500Market'
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
import { transferFromAccountNote } from '../lib/transferFromAccountNote'
import {
  defaultAvatarColorForIndex,
  type KidAvatarColorId,
} from '../lib/kidAvatarColors'

type CloudLoadStatus = 'local' | 'loading' | 'ready' | 'error'

type DsaContextValue = {
  state: DsaState
  /** False while pulling the initial cloud snapshot after sign-in. */
  remoteHydrated: boolean
  /** Cloud fetch failed — app will not push (avoids wiping remote data). */
  cloudLoadStatus: CloudLoadStatus
  /** Last cloud save error (push), if any. */
  syncError: string | null
  clearSyncError: () => void
  retryCloudLoad: () => void
  kidById: Map<string, Kid>
  accountById: Map<string, Account>
  accountsForKid: (kidId: string) => Account[]
  depositsForAccount: (accountId: string) => DepositRecord[]
  familyTotalCents: number
  addKid: (name: string, avatarColor?: KidAvatarColorId) => string | null
  addAccount: (
    kidId: string,
    name: string,
    opts?: { strategy?: InvestmentStrategy; openingDepositCents?: number },
  ) => string | null
  renameKid: (kidId: string, name: string) => void
  setKidAvatarColor: (kidId: string, avatarColor: KidAvatarColorId) => void
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
  closeAccount: (accountId: string) => boolean
  transferBetweenAccounts: (
    sourceAccountId: string,
    targetAccountId: string,
    amountCents: number,
  ) => boolean
  closeKid: (kidId: string) => boolean
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
  const [cloudLoadStatus, setCloudLoadStatus] = useState<CloudLoadStatus>(() =>
    remoteUserId ? 'loading' : 'local',
  )
  const [syncError, setSyncError] = useState<string | null>(null)
  /** True after the first successful cloud pull for the current user. */
  const cloudPullDoneRef = useRef(false)
  const marketRefreshGenRef = useRef(0)

  const remoteHydrated =
    cloudLoadStatus === 'local' ||
    cloudLoadStatus === 'ready' ||
    cloudLoadStatus === 'error'

  const fetchRemoteState = useCallback(async (userId: string) => {
    const remote = await fetchDsaState(userId)
    return reconcileBalancesFromDeposits(remote)
  }, [])

  useEffect(() => {
    if (!remoteUserId) {
      cloudPullDoneRef.current = false
      return
    }

    cloudPullDoneRef.current = false
    let cancelled = false

    fetchRemoteState(remoteUserId)
      .then((remote) => {
        if (cancelled) return
        setState(remote)
        setCloudLoadStatus('ready')
        setSyncError(null)
        cloudPullDoneRef.current = true
      })
      .catch((err) => {
        console.error('[DSA] Failed to load cloud state', err)
        if (!cancelled) setCloudLoadStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [remoteUserId, fetchRemoteState])

  const retryCloudLoad = useCallback(() => {
    if (!remoteUserId) return
    setCloudLoadStatus('loading')
    cloudPullDoneRef.current = false
    fetchRemoteState(remoteUserId)
      .then((remote) => {
        setState(remote)
        setCloudLoadStatus('ready')
        setSyncError(null)
        cloudPullDoneRef.current = true
      })
      .catch((err) => {
        console.error('[DSA] Failed to load cloud state', err)
        setCloudLoadStatus('error')
      })
  }, [remoteUserId, fetchRemoteState])

  const refreshMarketData = useCallback(() => {
    const gen = ++marketRefreshGenRef.current
    void refreshSp500MarketData({ tryLive: true }).then(() => {
      if (marketRefreshGenRef.current !== gen) return
      setState((s) => applyGrowthSimulationToState(s))
    })
  }, [])

  const marketAccountIdsKey = useMemo(
    () =>
      state.accounts
        .filter((a) => a.strategy.mode === 'stock_market')
        .map((a) => a.id)
        .sort()
        .join(','),
    [state.accounts],
  )

  useEffect(() => {
    if (!remoteHydrated || !marketAccountIdsKey) return
    refreshMarketData()
    // Intentionally omit state.accounts — balances must not retrigger fetches.
  }, [remoteHydrated, marketAccountIdsKey, refreshMarketData])

  useEffect(() => {
    if (
      !cloudPullDoneRef.current ||
      cloudLoadStatus !== 'ready' ||
      !remoteUserId
    ) {
      return
    }
    let cancelled = false
    const t = setTimeout(() => {
      if (!cancelled) {
        void pushDsaState(remoteUserId, state)
          .then(() => {
            if (!cancelled) setSyncError(null)
          })
          .catch((err) => {
            console.error('[DSA] Supabase sync failed', err)
            if (!cancelled) {
              setSyncError(
                err instanceof Error ? err.message : 'Cloud save failed',
              )
            }
          })
      }
    }, 650)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [state, cloudLoadStatus, remoteUserId])

  useEffect(() => {
    if (cloudLoadStatus !== 'local') return
    saveState(state)
  }, [state, cloudLoadStatus, remoteUserId])

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

  const addKid = useCallback((name: string, avatarColor?: KidAvatarColorId) => {
    const trimmed = name.trim()
    if (!trimmed) return null
    const id = crypto.randomUUID()
    setState((s) => {
      const kid: Kid = {
        id,
        name: trimmed,
        avatarColor: avatarColor ?? defaultAvatarColorForIndex(s.kids.length),
        createdAt: new Date().toISOString(),
      }
      return { ...s, kids: [...s.kids, kid] }
    })
    return id
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
        const next = applyGrowthSimulationToState({
          ...s,
          accounts: [...s.accounts, account],
          deposits,
        })
        if (account.strategy.mode === 'stock_market') {
          refreshMarketData()
        }
        return next
      })
      return id
    },
    [kidById, refreshMarketData],
  )

  const renameKid = useCallback((kidId: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setState((s) => ({
      ...s,
      kids: s.kids.map((k) => (k.id === kidId ? { ...k, name: trimmed } : k)),
    }))
  }, [])

  const setKidAvatarColor = useCallback(
    (kidId: string, avatarColor: KidAvatarColorId) => {
      setState((s) => ({
        ...s,
        kids: s.kids.map((k) =>
          k.id === kidId ? { ...k, avatarColor } : k,
        ),
      }))
    },
    [],
  )

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

  const closeAccount = useCallback((accountId: string) => {
    let closed = false
    setState((s) => {
      if (!s.accounts.some((a) => a.id === accountId)) return s
      closed = true
      return applyGrowthSimulationToState({
        ...s,
        accounts: s.accounts.filter((a) => a.id !== accountId),
        deposits: s.deposits.filter((d) => d.accountId !== accountId),
      })
    })
    return closed
  }, [])

  const transferBetweenAccounts = useCallback(
    (
      sourceAccountId: string,
      targetAccountId: string,
      amountCents: number,
    ) => {
      let ok = false
      setState((s) => {
        const source = s.accounts.find((a) => a.id === sourceAccountId)
        const target = s.accounts.find((a) => a.id === targetAccountId)
        if (!source || !target || source.id === target.id) return s

        const amount = Math.round(amountCents)
        if (amount <= 0 || amount > source.balanceCents) return s

        const now = new Date().toISOString()
        const recordedAt = localDateString()
        const note = normalizeLedgerNote(
          transferFromAccountNote(source.name),
        )

        ok = true
        return applyGrowthSimulationToState({
          ...s,
          deposits: [
            ...s.deposits,
            {
              id: crypto.randomUUID(),
              accountId: sourceAccountId,
              kind: 'withdrawal' as const,
              amountCents: amount,
              note,
              recordedAt,
              createdAt: now,
            },
            {
              id: crypto.randomUUID(),
              accountId: targetAccountId,
              kind: 'deposit' as const,
              amountCents: amount,
              note,
              recordedAt,
              createdAt: now,
            },
          ],
        })
      })
      return ok
    },
    [],
  )

  const closeKid = useCallback((kidId: string) => {
    let closed = false
    setState((s) => {
      if (!s.kids.some((k) => k.id === kidId)) return s
      closed = true
      const accountIds = new Set(
        s.accounts.filter((a) => a.kidId === kidId).map((a) => a.id),
      )
      return applyGrowthSimulationToState({
        ...s,
        kids: s.kids.filter((k) => k.id !== kidId),
        accounts: s.accounts.filter((a) => a.kidId !== kidId),
        deposits: s.deposits.filter((d) => !accountIds.has(d.accountId)),
      })
    })
    return closed
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

  const clearSyncError = useCallback(() => setSyncError(null), [])

  const value = useMemo(
    () => ({
      state,
      remoteHydrated,
      cloudLoadStatus,
      syncError,
      clearSyncError,
      retryCloudLoad,
      kidById,
      accountById,
      accountsForKid,
      depositsForAccount,
      familyTotalCents,
      addKid,
      addAccount,
      renameKid,
      setKidAvatarColor,
      renameAccount,
      deposit,
      updateDeposit,
      deleteDeposit,
      closeAccount,
      transferBetweenAccounts,
      closeKid,
      setStrategy,
    }),
    [
      state,
      remoteHydrated,
      cloudLoadStatus,
      syncError,
      clearSyncError,
      retryCloudLoad,
      kidById,
      accountById,
      accountsForKid,
      depositsForAccount,
      familyTotalCents,
      addKid,
      addAccount,
      renameKid,
      setKidAvatarColor,
      renameAccount,
      deposit,
      updateDeposit,
      deleteDeposit,
      closeAccount,
      transferBetweenAccounts,
      closeKid,
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
