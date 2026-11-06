import {
  MARKET_ESTIMATE_NOTE,
  MARKET_ILLUSTRATION_NOTE,
  SIMULATED_BALANCE_NOTE,
} from '../lib/legalCopy'

type Props = {
  /** True when this screen includes a like-the-market balance. */
  showMarketIllustration?: boolean
  /** True when a like-the-market balance includes the ~7% teaching fill today. */
  showMarketEstimate?: boolean
  className?: string
}

export function SimulatedBalanceNote({
  showMarketIllustration = false,
  showMarketEstimate = false,
  className,
}: Props) {
  return (
    <p className={className ? `simulated-balance-note ${className}` : 'simulated-balance-note'}>
      {SIMULATED_BALANCE_NOTE}
      {showMarketIllustration ? ` ${MARKET_ILLUSTRATION_NOTE}` : null}
      {showMarketIllustration && showMarketEstimate ? ` ${MARKET_ESTIMATE_NOTE}` : null}
    </p>
  )
}
