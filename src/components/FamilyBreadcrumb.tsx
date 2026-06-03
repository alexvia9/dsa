import { Link } from 'react-router-dom'
import { useDsa } from '../context/DsaContext'
import { showFamilyOverview } from '../lib/familyRouting'

type Props = {
  /** Include trailing " / " when the link is shown. */
  trailingSeparator?: boolean
}

export function FamilyBreadcrumb({ trailingSeparator = true }: Props) {
  const { state } = useDsa()
  if (!showFamilyOverview(state.kids.length)) return null

  return (
    <>
      <Link to="/family">Family</Link>
      {trailingSeparator ? <span aria-hidden> / </span> : null}
    </>
  )
}
