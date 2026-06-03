import { Navigate } from 'react-router-dom'
import { useDsa } from '../context/DsaContext'
import { FamilyPage } from './FamilyPage'
import { FamilySetupPage } from './FamilySetupPage'

/** `/family` — setup (0 kids), redirect (1 kid), or multi-child dashboard (2+). */
export function FamilyHomeRoute() {
  const { state } = useDsa()
  const count = state.kids.length

  if (count === 1) {
    return <Navigate to={`/kids/${state.kids[0]!.id}`} replace />
  }

  if (count === 0) {
    return <FamilySetupPage />
  }

  return <FamilyPage />
}
