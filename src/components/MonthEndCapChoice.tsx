import { type FormEvent, useMemo, useState } from 'react'
import { useDsa } from '../context/DsaContext'
import { MOVED_PAST_LEARNING_CAP_NOTE } from '../lib/monthEndCap'
import { formatUsd, parseUsdToCents } from '../lib/money'
import type { Account } from '../types/dsa'

type Placement = 'savings' | 'market' | 'split'

const NEW_ACCOUNT = 'new'

type Props = {
  account: Account
  capCents: number
  excessCents: number
}

function accountsOfMode(accounts: Account[], kidId: string, mode: Account['strategy']['mode']) {
  return accounts.filter((a) => a.kidId === kidId && a.strategy.mode === mode)
}

function selectedTarget(selected: string, accounts: Account[]): string {
  if (selected === NEW_ACCOUNT) return NEW_ACCOUNT
  if (accounts.some((a) => a.id === selected)) return selected
  return accounts[0]?.id ?? NEW_ACCOUNT
}

export function MonthEndCapChoice({ account, capCents, excessCents }: Props) {
  const { state, addAccount, transferBetweenAccounts } = useDsa()
  const savingsAccounts = useMemo(
    () => accountsOfMode(state.accounts, account.kidId, 'savings_apr'),
    [state.accounts, account.kidId],
  )
  const marketAccounts = useMemo(
    () => accountsOfMode(state.accounts, account.kidId, 'stock_market'),
    [state.accounts, account.kidId],
  )
  const canSplit = excessCents >= 2

  const [placement, setPlacement] = useState<Placement>('savings')
  const [savingsTarget, setSavingsTarget] = useState(
    () => savingsAccounts[0]?.id ?? NEW_ACCOUNT,
  )
  const [marketTarget, setMarketTarget] = useState(
    () => marketAccounts[0]?.id ?? NEW_ACCOUNT,
  )
  const [savingsName, setSavingsName] = useState('Savings')
  const [marketName, setMarketName] = useState('Market')
  const [savingsRate, setSavingsRate] = useState('3')
  const [splitSavingsDollars, setSplitSavingsDollars] = useState(() =>
    (Math.floor(excessCents / 2) / 100).toFixed(2),
  )
  const [error, setError] = useState<string | null>(null)

  const savingsSelection = selectedTarget(savingsTarget, savingsAccounts)
  const marketSelection = selectedTarget(marketTarget, marketAccounts)
  const activePlacement: Placement =
    placement === 'split' && !canSplit ? 'savings' : placement

  const needsSavings = activePlacement === 'savings' || activePlacement === 'split'
  const needsMarket = activePlacement === 'market' || activePlacement === 'split'

  const splitSavingsCents = parseUsdToCents(splitSavingsDollars)
  const splitIsValid =
    splitSavingsCents != null &&
    splitSavingsCents > 0 &&
    splitSavingsCents < excessCents
  const marketRemainderCents =
    splitIsValid && splitSavingsCents != null
      ? excessCents - splitSavingsCents
      : null

  const openSavings = (): string | null => {
    if (savingsSelection !== NEW_ACCOUNT) return savingsSelection
    const parsed = Number.parseFloat(savingsRate)
    const annualRatePercent =
      Number.isFinite(parsed) && parsed >= 0 ? parsed : 3
    return addAccount(account.kidId, savingsName.trim() || 'Savings', {
      strategy: { mode: 'savings_apr', annualRatePercent },
    })
  }

  const openMarket = (): string | null => {
    if (marketSelection !== NEW_ACCOUNT) return marketSelection
    return addAccount(account.kidId, marketName.trim() || 'Market', {
      strategy: { mode: 'stock_market', benchmarkSymbol: '' },
    })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    let savingsCents = 0
    let marketCents = 0
    if (activePlacement === 'savings') savingsCents = excessCents
    else if (activePlacement === 'market') marketCents = excessCents
    else {
      if (!splitIsValid || splitSavingsCents == null) {
        setError(
          `The two amounts need to add up to ${formatUsd(excessCents)}, and each one has to be more than $0.00.`,
        )
        return
      }
      savingsCents = splitSavingsCents
      marketCents = excessCents - splitSavingsCents
    }

    if (needsSavings && savingsSelection === NEW_ACCOUNT && savingsRate.trim() !== '') {
      const parsed = Number.parseFloat(savingsRate)
      if (!Number.isFinite(parsed) || parsed < 0) {
        setError('Enter an annual rate of 0 or more.')
        return
      }
    }

    if (savingsCents + marketCents > account.balanceCents) {
      setError('That amount is larger than the account value.')
      return
    }

    const savingsId = savingsCents > 0 ? openSavings() : null
    const marketId = marketCents > 0 ? openMarket() : null
    if (savingsCents > 0 && !savingsId) {
      setError('Could not open a savings account.')
      return
    }
    if (marketCents > 0 && !marketId) {
      setError('Could not open a market account.')
      return
    }

    if (savingsId && savingsCents > 0) {
      transferBetweenAccounts(
        account.id,
        savingsId,
        savingsCents,
        MOVED_PAST_LEARNING_CAP_NOTE,
      )
    }
    if (marketId && marketCents > 0) {
      transferBetweenAccounts(
        account.id,
        marketId,
        marketCents,
        MOVED_PAST_LEARNING_CAP_NOTE,
      )
    }
  }

  return (
    <section
      className="account-fidelity-panel month-end-cap-choice"
      aria-labelledby="month-end-cap-choice-title"
    >
      <h2 id="month-end-cap-choice-title" className="account-fidelity-panel-title">
        Past the learning cap
      </h2>
      <p className="account-fidelity-panel-lede">
        This month-end jar earns its rate on {formatUsd(capCents)}.{' '}
        {formatUsd(excessCents)} is above that and is not compounding. It stays
        here until you choose an account like savings, one like the market, or a split.
      </p>
      <form onSubmit={submit}>
        <fieldset className="field-group month-end-cap-placement">
          <legend className="sr-only">Where this money should go</legend>
          <label className="radio-row">
            <input
              type="radio"
              name="month-end-cap-placement"
              checked={activePlacement === 'savings'}
              onChange={() => {
                setPlacement('savings')
                setError(null)
              }}
            />
            <span>All to savings</span>
          </label>
          <label className="radio-row">
            <input
              type="radio"
              name="month-end-cap-placement"
              checked={activePlacement === 'market'}
              onChange={() => {
                setPlacement('market')
                setError(null)
              }}
            />
            <span>All to an account like the market</span>
          </label>
          {canSplit ? (
            <label className="radio-row">
              <input
                type="radio"
                name="month-end-cap-placement"
                checked={activePlacement === 'split'}
                onChange={() => {
                  setPlacement('split')
                  setError(null)
                }}
              />
              <span>Split between an account like savings and one like the market</span>
            </label>
          ) : null}
        </fieldset>

        <div
          className={
            'month-end-cap-fields' +
            (activePlacement === 'split' ? ' month-end-cap-fields--split' : '')
          }
        >
          {needsSavings ? (
            <DestinationFields
              legend="Savings"
              accounts={savingsAccounts}
              target={savingsSelection}
              onTarget={(id) => {
                setSavingsTarget(id)
                setError(null)
              }}
              newName={savingsName}
              onNewName={setSavingsName}
              newNameLabel="New savings account name"
              emptyLabel="Open a new savings account"
              rate={savingsRate}
              onRate={setSavingsRate}
              amountLabel={
                activePlacement === 'split' ? 'Amount to savings' : undefined
              }
              amountDollars={
                activePlacement === 'split' ? splitSavingsDollars : undefined
              }
              onAmountDollars={
                activePlacement === 'split' ? setSplitSavingsDollars : undefined
              }
            />
          ) : null}
          {needsMarket ? (
            <DestinationFields
              legend="Market"
              accounts={marketAccounts}
              target={marketSelection}
              onTarget={(id) => {
                setMarketTarget(id)
                setError(null)
              }}
              newName={marketName}
              onNewName={setMarketName}
              newNameLabel="New market account name"
              emptyLabel="Open a new market account"
              remainderCents={
                activePlacement === 'split' ? marketRemainderCents : undefined
              }
            />
          ) : null}
        </div>

        {error ? (
          <p className="month-end-cap-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="month-end-cap-actions">
          <button type="submit" className="btn primary">
            Move {formatUsd(excessCents)}
          </button>
        </div>
      </form>
    </section>
  )
}

function DestinationFields({
  legend,
  accounts,
  target,
  onTarget,
  newName,
  onNewName,
  newNameLabel,
  emptyLabel,
  rate,
  onRate,
  amountLabel,
  amountDollars,
  onAmountDollars,
  remainderCents,
}: {
  legend: string
  accounts: Account[]
  target: string
  onTarget: (id: string) => void
  newName: string
  onNewName: (name: string) => void
  newNameLabel: string
  emptyLabel: string
  rate?: string
  onRate?: (rate: string) => void
  amountLabel?: string
  amountDollars?: string
  onAmountDollars?: (dollars: string) => void
  remainderCents?: number | null
}) {
  return (
    <fieldset className="field-group month-end-cap-destination">
      <legend>{legend}</legend>
      <label className="field">
        <span className="label">Account</span>
        <select
          className="input"
          value={target}
          onChange={(e) => onTarget(e.target.value)}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
          <option value={NEW_ACCOUNT}>{emptyLabel}</option>
        </select>
      </label>
      {target === NEW_ACCOUNT ? (
        <label className="field">
          <span className="label">{newNameLabel}</span>
          <input
            className="input"
            value={newName}
            onChange={(e) => onNewName(e.target.value)}
            autoComplete="off"
          />
        </label>
      ) : null}
      {target === NEW_ACCOUNT && rate !== undefined && onRate ? (
        <label className="field">
          <span className="label">Annual rate (%)</span>
          <input
            className="input"
            inputMode="decimal"
            value={rate}
            onChange={(e) => onRate(e.target.value)}
          />
        </label>
      ) : null}
      {amountLabel && amountDollars !== undefined && onAmountDollars ? (
        <label className="field">
          <span className="label">{amountLabel}</span>
          <input
            className="input"
            inputMode="decimal"
            value={amountDollars}
            onChange={(e) => onAmountDollars(e.target.value)}
          />
        </label>
      ) : null}
      {remainderCents !== undefined ? (
        <p className="hint">
          {remainderCents == null
            ? 'Enter a savings amount greater than $0.00 and less than the extra.'
            : `${formatUsd(remainderCents)} goes to an account like the market.`}
        </p>
      ) : null}
    </fieldset>
  )
}
