import {
  type FormEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { transferFromAccountNote } from '../lib/transferFromAccountNote'
import { formatUsd, parseUsdToCents } from '../lib/money'
import { useDsa } from '../context/DsaContext'
import type { Account, Kid } from '../types/dsa'

type Props = {
  account: Account
  kid: Kid
  onClosed: () => void
}

type TransferTarget = {
  account: Account
  kidName: string
}

type ActiveModal = 'transfer' | 'close' | null

function useTransferTargets(
  accountId: string,
  state: ReturnType<typeof useDsa>['state'],
  kidById: ReturnType<typeof useDsa>['kidById'],
): TransferTarget[] {
  return useMemo(() => {
    return state.accounts
      .filter((a) => a.id !== accountId)
      .map((a) => ({
        account: a,
        kidName: kidById.get(a.kidId)?.name ?? 'Unknown',
      }))
      .sort((a, b) => {
        const kidCmp = a.kidName.localeCompare(b.kidName)
        if (kidCmp !== 0) return kidCmp
        return a.account.name.localeCompare(b.account.name)
      })
  }, [state.accounts, accountId, kidById])
}

export function CloseAccountSection({ account, kid, onClosed }: Props) {
  const { state, kidById, accountById, transferBetweenAccounts, closeAccount } =
    useDsa()

  const transferTargets = useTransferTargets(account.id, state, kidById)
  const transferDialogRef = useRef<HTMLDialogElement>(null)
  const closeDialogRef = useRef<HTMLDialogElement>(null)

  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [transferTargetId, setTransferTargetId] = useState('')
  const [transferAmountMode, setTransferAmountMode] = useState<'all' | 'partial'>(
    'all',
  )
  const [transferAmountDollars, setTransferAmountDollars] = useState('')
  const [closeAfterTransfer, setCloseAfterTransfer] = useState(false)

  const liveAccount = accountById.get(account.id) ?? account
  const balanceCents = liveAccount.balanceCents
  const hasBalance = balanceCents > 0
  const hasTransferTargets = transferTargets.length > 0
  const canTransferFunds = hasBalance && hasTransferTargets

  const effectiveTransferTargetId =
    transferTargetId &&
    transferTargets.some((t) => t.account.id === transferTargetId)
      ? transferTargetId
      : (transferTargets[0]?.account.id ?? '')

  const selectedTarget = transferTargets.find(
    (t) => t.account.id === effectiveTransferTargetId,
  )

  useLayoutEffect(() => {
    const el = transferDialogRef.current
    if (!el) return
    if (activeModal === 'transfer') {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [activeModal])

  useLayoutEffect(() => {
    const el = closeDialogRef.current
    if (!el) return
    if (activeModal === 'close') {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [activeModal])

  const dismissModals = () => {
    setActiveModal(null)
    setCloseAfterTransfer(false)
  }

  const openTransferModal = () => {
    setTransferTargetId(transferTargets[0]?.account.id ?? '')
    setTransferAmountMode('all')
    setTransferAmountDollars('')
    setCloseAfterTransfer(false)
    setActiveModal('transfer')
  }

  const openCloseModal = () => {
    setActiveModal('close')
  }

  const switchToTransferFromClose = () => {
    setTransferTargetId(transferTargets[0]?.account.id ?? '')
    setTransferAmountMode('all')
    setTransferAmountDollars('')
    setCloseAfterTransfer(false)
    setActiveModal('transfer')
  }

  const handleTransferDialogClose = () => {
    if (activeModal === 'transfer') dismissModals()
  }

  const handleCloseDialogClose = () => {
    if (activeModal === 'close') dismissModals()
  }

  const resolveTransferCents = (): number | null => {
    if (transferAmountMode === 'all') return balanceCents
    return parseUsdToCents(transferAmountDollars)
  }

  const submitTransfer = (e: FormEvent) => {
    e.preventDefault()
    if (!selectedTarget || !canTransferFunds) return

    const cents = resolveTransferCents()
    if (cents == null || cents <= 0 || cents > balanceCents) return

    if (
      !transferBetweenAccounts(
        liveAccount.id,
        selectedTarget.account.id,
        cents,
      )
    ) {
      return
    }

    const isFullTransfer = cents >= balanceCents
    if (closeAfterTransfer && isFullTransfer) {
      closeAccount(liveAccount.id)
      dismissModals()
      onClosed()
      return
    }

    dismissModals()
  }

  const submitClose = () => {
    if (!closeAccount(liveAccount.id)) return
    dismissModals()
    onClosed()
  }

  const transferCentsPreview = resolveTransferCents()
  const showCloseAfterTransfer =
    canTransferFunds &&
    transferCentsPreview != null &&
    transferCentsPreview > 0 &&
    transferCentsPreview >= balanceCents

  return (
    <section className="account-fidelity-panel account-close-section">
      <h2 className="account-fidelity-panel-title">Account options</h2>
      <p className="muted small account-close-lede">
        Transfer money out of <strong>{account.name}</strong> or close the
        account and remove its history from {kid.name}&apos;s profile.
      </p>

      <div className="account-close-cta-row">
        <button
          type="button"
          className="btn primary account-close-cta"
          onClick={openTransferModal}
        >
          Transfer funds
        </button>
        <button
          type="button"
          className="btn secondary account-close-cta account-fidelity-btn-outline"
          onClick={openCloseModal}
        >
          Close account
        </button>
      </div>

      <dialog
        ref={transferDialogRef}
        className="strategy-rule-modal account-close-modal"
        onClose={handleTransferDialogClose}
        aria-labelledby="transfer-funds-modal-title"
      >
        <form className="strategy-modal-box" onSubmit={submitTransfer}>
          <header className="strategy-modal-header">
            <h2 id="transfer-funds-modal-title" className="strategy-modal-title">
              Transfer funds
            </h2>
            <button
              type="button"
              className="btn modal-close-btn"
              onClick={dismissModals}
              aria-label="Close"
            >
              ×
            </button>
          </header>

          <div className="strategy-modal-body account-close-modal-body">
            {!hasBalance ? (
              <p className="account-close-modal-lede">
                <strong>{account.name}</strong> has no balance to transfer. You
                can close the account to remove it and delete all ledger
                history.
              </p>
            ) : !hasTransferTargets ? (
              <p className="account-close-modal-lede">
                Add another account in your family before you can transfer money
                out of <strong>{account.name}</strong>.
              </p>
            ) : (
              <>
                <p className="muted small account-close-modal-lede">
                  Move money from <strong>{account.name}</strong> to another
                  account. The destination gets a deposit labeled{' '}
                  <strong>{transferFromAccountNote(account.name)}</strong>.
                  Current balance: <strong>{formatUsd(balanceCents)}</strong>.
                </p>

                <label className="field">
                  <span className="label">Transfer to</span>
                  <select
                    className="input"
                    value={effectiveTransferTargetId}
                    onChange={(e) => setTransferTargetId(e.target.value)}
                    required
                  >
                    {transferTargets.map(({ account: a, kidName }) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({kidName}) — {formatUsd(a.balanceCents)}
                      </option>
                    ))}
                  </select>
                </label>

                <fieldset className="account-close-amount-fieldset">
                  <legend className="label">Amount</legend>
                  <label className="radio-row">
                    <input
                      type="radio"
                      name="transfer-amount-mode"
                      checked={transferAmountMode === 'all'}
                      onChange={() => setTransferAmountMode('all')}
                    />
                    <span>Transfer all ({formatUsd(balanceCents)})</span>
                  </label>
                  <label className="radio-row">
                    <input
                      type="radio"
                      name="transfer-amount-mode"
                      checked={transferAmountMode === 'partial'}
                      onChange={() => {
                        setTransferAmountMode('partial')
                        setCloseAfterTransfer(false)
                      }}
                    />
                    <span>Transfer a portion</span>
                  </label>
                </fieldset>

                {transferAmountMode === 'partial' ? (
                  <label className="field">
                    <span className="label">Amount to transfer</span>
                    <input
                      className="input"
                      inputMode="decimal"
                      value={transferAmountDollars}
                      onChange={(e) => setTransferAmountDollars(e.target.value)}
                      placeholder="0.00"
                      required
                      aria-label="Amount to transfer in dollars"
                    />
                  </label>
                ) : null}

                {showCloseAfterTransfer ? (
                  <div className="account-close-after-transfer-block">
                    <label className="checkbox-row account-close-after-transfer">
                      <input
                        type="checkbox"
                        checked={closeAfterTransfer}
                        onChange={(e) =>
                          setCloseAfterTransfer(e.target.checked)
                        }
                        aria-describedby={
                          closeAfterTransfer
                            ? 'close-after-transfer-warning'
                            : undefined
                        }
                      />
                      <span>
                        Close <strong>{account.name}</strong> after
                        transferring the full balance
                      </span>
                    </label>
                    {closeAfterTransfer ? (
                      <p
                        id="close-after-transfer-warning"
                        className="account-close-after-transfer-warning"
                        role="status"
                      >
                        Closing will permanently delete all data for this
                        account — every deposit, withdrawal, and ledger entry.
                        Only the transfer on the destination account remains.
                        This cannot be undone.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </div>

          <footer className="strategy-modal-footer">
            <button
              type="button"
              className="btn secondary"
              onClick={dismissModals}
            >
              Cancel
            </button>
            {!hasBalance || !hasTransferTargets ? (
              <button
                type="button"
                className="btn primary"
                onClick={() => setActiveModal('close')}
              >
                Close account
              </button>
            ) : (
              <button type="submit" className="btn primary">
                {closeAfterTransfer && showCloseAfterTransfer
                  ? 'Transfer and close'
                  : 'Transfer'}
              </button>
            )}
          </footer>
        </form>
      </dialog>

      <dialog
        ref={closeDialogRef}
        className="strategy-rule-modal account-close-modal"
        onClose={handleCloseDialogClose}
        aria-labelledby="close-account-modal-title"
      >
        <div className="strategy-modal-box">
          <header className="strategy-modal-header">
            <h2 id="close-account-modal-title" className="strategy-modal-title">
              Close account
            </h2>
            <button
              type="button"
              className="btn modal-close-btn"
              onClick={dismissModals}
              aria-label="Close"
            >
              ×
            </button>
          </header>

          <div className="strategy-modal-body account-close-modal-body">
            {!hasBalance ? (
              <p className="account-close-modal-lede">
                Closing <strong>{account.name}</strong> will permanently delete
                all deposits, withdrawals, and history for this account. The
                balance is <strong>{formatUsd(0)}</strong>, so nothing will move
                — only the record goes away.
              </p>
            ) : hasTransferTargets ? (
              <>
                <p className="account-close-modal-lede">
                  <strong>{account.name}</strong> still has{' '}
                  <strong>{formatUsd(balanceCents)}</strong>. Transfer it to
                  another account first, or close without transferring and
                  remove that balance from your family totals.
                </p>
                <p className="muted small">
                  Closing always deletes this account&apos;s full ledger history.
                  That cannot be undone.
                </p>
              </>
            ) : (
              <p className="account-close-modal-lede">
                <strong>{account.name}</strong> has{' '}
                <strong>{formatUsd(balanceCents)}</strong> and there is no other
                account to receive a transfer. Closing will remove the account
                and delete all history — the balance will no longer appear
                anywhere.
              </p>
            )}
          </div>

          <footer className="strategy-modal-footer account-close-modal-footer">
            <button
              type="button"
              className="btn secondary"
              onClick={dismissModals}
            >
              Cancel
            </button>
            {hasBalance && hasTransferTargets ? (
              <button
                type="button"
                className="btn primary"
                onClick={switchToTransferFromClose}
              >
                Transfer funds instead
              </button>
            ) : null}
            <button
              type="button"
              className={
                hasBalance
                  ? 'btn secondary account-close-btn'
                  : 'btn primary account-close-btn'
              }
              onClick={submitClose}
            >
              {hasBalance ? 'Close without transferring' : 'Close account'}
            </button>
          </footer>
        </div>
      </dialog>
    </section>
  )
}
