import { accountListGrowthTrend } from '../lib/accountGrowth'
import { formatUsd } from '../lib/money'
import type { Account, DepositRecord } from '../types/dsa'

type Props = {
  account: Account
  deposits: DepositRecord[]
}

export function AccountGrowthTrend({ account, deposits }: Props) {
  const trend = accountListGrowthTrend(account, deposits)
  if (!trend) return null

  const dir =
    trend.deltaCents > 0 ? 'up' : trend.deltaCents < 0 ? 'down' : 'flat'

  const valueText =
    trend.deltaCents > 0
      ? `+${formatUsd(trend.deltaCents)}`
      : formatUsd(trend.deltaCents)

  return (
    <span
      className={`account-growth-trend account-growth-trend--${dir}`}
      aria-label={`Rule-based growth ${valueText}, ${trend.periodLabel}`}
    >
      <span className="account-growth-trend-arrow" aria-hidden>
        {dir === 'up' ? '↑' : dir === 'down' ? '↓' : '→'}
      </span>{' '}
      <span className="account-growth-trend-delta">{valueText}</span>
    </span>
  )
}
