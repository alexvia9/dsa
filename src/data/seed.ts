import type { DsaState } from '../types/dsa'
import { defaultStrategy } from '../types/dsa'
import { localDateString } from '../lib/dateLocal'

export function seedState(): DsaState {
  const t = new Date().toISOString()
  const day = localDateString()
  const kidA = crypto.randomUUID()
  const kidB = crypto.randomUUID()
  const accSpend = crypto.randomUUID()
  const accCollege = crypto.randomUUID()
  const accMain = crypto.randomUUID()

  return {
    kids: [
      { id: kidA, name: 'Alex', createdAt: t },
      { id: kidB, name: 'Sam', createdAt: t },
    ],
    accounts: [
      {
        id: accSpend,
        kidId: kidA,
        name: 'Spend + save',
        balanceCents: 12_50,
        strategy: defaultStrategy(),
        createdAt: t,
      },
      {
        id: accCollege,
        kidId: kidA,
        name: 'College jar',
        balanceCents: 200_00,
        strategy: {
          mode: 'stock_market',
          benchmarkSymbol: '',
        },
        createdAt: t,
      },
      {
        id: accMain,
        kidId: kidB,
        name: 'Main',
        balanceCents: 45_75,
        strategy: {
          mode: 'monthly_end_compound',
          monthlyRatePercentByMonth: {},
        },
        createdAt: t,
      },
    ],
    deposits: [
      {
        id: crypto.randomUUID(),
        accountId: accSpend,
        kind: 'deposit',
        amountCents: 12_50,
        recordedAt: day,
        createdAt: t,
      },
      {
        id: crypto.randomUUID(),
        accountId: accCollege,
        kind: 'deposit',
        amountCents: 200_00,
        recordedAt: day,
        createdAt: t,
      },
      {
        id: crypto.randomUUID(),
        accountId: accMain,
        kind: 'deposit',
        amountCents: 45_75,
        recordedAt: day,
        createdAt: t,
      },
    ],
  }
}
