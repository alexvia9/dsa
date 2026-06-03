import {
  type FormEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useDsa } from '../context/DsaContext'
import { cloneInvestmentStrategy } from '../lib/cloneStrategy'
import { parseUsdToCents } from '../lib/money'
import type { InvestmentStrategy } from '../types/dsa'
import { defaultStrategy } from '../types/dsa'
import { StrategyEditor } from './StrategyEditor'

type Props = {
  kidId: string
  kidName: string
  /** After success: go to the new account, or stay on the kid page */
  afterCreate?: 'account' | 'close'
}

export function AddAccountFlow({
  kidId,
  kidName,
  afterCreate = 'close',
}: Props) {
  const navigate = useNavigate()
  const { addAccount } = useDsa()
  const [panelOpen, setPanelOpen] = useState(false)
  const [accountName, setAccountName] = useState('')
  const [openingDollars, setOpeningDollars] = useState('')
  const [strategy, setStrategy] = useState<InvestmentStrategy>(() =>
    defaultStrategy(),
  )
  const strategyRef = useRef<InvestmentStrategy | null>(null)
  const panelRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    strategyRef.current = strategy
  }, [strategy])

  useEffect(() => {
    if (!panelOpen) return
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const id = requestAnimationFrame(() => {
      document.getElementById('add-account-inline-name')?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [panelOpen])

  const setStrategySynced = (s: InvestmentStrategy) => {
    strategyRef.current = s
    setStrategy(s)
  }

  const reset = () => {
    setAccountName('')
    const fresh = defaultStrategy()
    strategyRef.current = fresh
    setStrategy(fresh)
    setOpeningDollars('')
  }

  const closePanel = () => {
    setPanelOpen(false)
    reset()
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const opening = parseUsdToCents(openingDollars.trim() || '0') ?? 0
    const latest = strategyRef.current ?? strategy
    const id = addAccount(kidId, accountName, {
      strategy: cloneInvestmentStrategy(latest),
      openingDepositCents: opening,
    })
    if (!id) return
    closePanel()
    if (afterCreate === 'account') {
      navigate(`/accounts/${id}`)
    }
  }

  return (
    <>
      {!panelOpen ? (
        <li className="account-table-add-cell">
          <button
            type="button"
            className="card add-account-cta add-account-cta-grid"
            onClick={() => setPanelOpen(true)}
            aria-label={`Add an account for ${kidName}`}
            aria-expanded="false"
          >
            <div className="add-account-cta-body-wrap">
              <div className="add-account-cta-body">
                <span className="add-account-cta-plus" aria-hidden>
                  +
                </span>
                <span className="account-name add-account-cta-label">
                  Add an account
                </span>
              </div>
            </div>
            <p
              className="strategy-pill block add-account-cta-spacer"
              aria-hidden="true"
            >
              &nbsp;
            </p>
          </button>
        </li>
      ) : null}

      {panelOpen ? (
        <li className="account-table-inline-form-row">
          <section
            ref={panelRef}
            className="add-account-inline-panel"
            aria-labelledby="add-account-inline-title"
          >
            <form className="add-account-inline-form" onSubmit={submit}>
              <header className="add-account-inline-header">
                <h2
                  id="add-account-inline-title"
                  className="add-account-inline-title"
                >
                  New account for {kidName}
                </h2>
              </header>

              <div className="add-account-inline-body">
                <div className="add-account-form add-account-form--compact">
                  <label className="field" htmlFor="add-account-inline-name">
                    <span className="label">Account name</span>
                    <input
                      id="add-account-inline-name"
                      className="input"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="e.g. College fund, Charity"
                      required
                    />
                  </label>

                  <div className="add-account-strategy-block">
                    <StrategyEditor
                      strategy={strategy}
                      onChange={setStrategySynced}
                      showFieldsetLegend={false}
                      accountTypePicker="cards"
                    />
                  </div>

                  <label
                    className="field"
                    htmlFor="add-account-inline-deposit"
                  >
                    <span className="label">First deposit (optional)</span>
                    <input
                      id="add-account-inline-deposit"
                      className="input"
                      inputMode="decimal"
                      value={openingDollars}
                      onChange={(e) => setOpeningDollars(e.target.value)}
                      placeholder="0.00"
                    />
                  </label>
                </div>
              </div>

              <footer className="add-account-inline-footer">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={closePanel}
                >
                  Cancel
                </button>
                <button type="submit" className="btn primary add-account-submit">
                  Create account
                </button>
              </footer>
            </form>
          </section>
        </li>
      ) : null}
    </>
  )
}
