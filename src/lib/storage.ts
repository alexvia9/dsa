import type { DsaState } from '../types/dsa'
import { migrateV1ToV2 } from './migrateState'

const KEY_V2 = 'dsa-state-v2'
const KEY_V1 = 'dsa-state-v1'

export function loadState(): DsaState | null {
  try {
    const rawV2 = localStorage.getItem(KEY_V2)
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as unknown
      const migrated = migrateV1ToV2(parsed)
      return migrated
    }

    const rawV1 = localStorage.getItem(KEY_V1)
    if (rawV1) {
      const migrated = migrateV1ToV2(JSON.parse(rawV1) as unknown)
      if (migrated) {
        localStorage.setItem(KEY_V2, JSON.stringify(migrated))
        return migrated
      }
    }

    return null
  } catch {
    return null
  }
}

export function saveState(state: DsaState): void {
  localStorage.setItem(KEY_V2, JSON.stringify(state))
}
