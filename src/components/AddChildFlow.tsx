import {
  type FormEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { KidAvatarColorPicker } from './KidAvatarColorPicker'
import { useDsa } from '../context/DsaContext'
import {
  defaultAvatarColorForIndex,
  type KidAvatarColorId,
} from '../lib/kidAvatarColors'
import { KidAvatar } from './KidAvatar'

type Props = {
  /** Grid tile (family dashboard) or inline block (setup / kid page). */
  variant?: 'tile' | 'standalone'
  /** Where to go after a successful add. */
  navigateTo?: 'new-kid' | 'family'
  ctaLabel?: string
}

export function AddChildFlow({
  variant = 'tile',
  navigateTo = 'new-kid',
  ctaLabel = 'Add a child',
}: Props) {
  const navigate = useNavigate()
  const { state, addKid } = useDsa()
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [avatarColor, setAvatarColor] = useState<KidAvatarColorId>(() =>
    defaultAvatarColorForIndex(0),
  )
  const dialogRef = useRef<HTMLDialogElement>(null)
  const uid = useId()
  const titleId = `add-child-title-${uid}`
  const nameInputId = `add-child-name-${uid}`

  useLayoutEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (modalOpen) {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [modalOpen])

  useEffect(() => {
    if (!modalOpen) return
    const id = requestAnimationFrame(() => {
      document.getElementById(nameInputId)?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [modalOpen, nameInputId])

  const openModal = () => {
    setAvatarColor(defaultAvatarColorForIndex(state.kids.length))
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setName('')
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const id = addKid(name, avatarColor)
    if (!id) return
    closeModal()
    if (navigateTo === 'family') {
      navigate('/family')
    } else {
      navigate(`/kids/${id}`)
    }
  }

  const modal = (
    <dialog
      ref={dialogRef}
      className="strategy-rule-modal add-child-modal"
      onClose={closeModal}
      aria-labelledby={titleId}
    >
      <form className="strategy-modal-box" onSubmit={submit}>
        <header className="strategy-modal-header">
          <h2 id={titleId} className="strategy-modal-title">
            Add a child
          </h2>
          <button
            type="button"
            className="btn modal-close-btn"
            onClick={closeModal}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="strategy-modal-body add-child-modal-body">
          <p className="muted small add-child-inline-lede">
            Pick a color and name — you can change both later.
          </p>
          <div className="add-child-inline-body">
            <div className="add-child-preview">
              <KidAvatar
                name={name || '?'}
                colorId={avatarColor}
                className="add-child-preview-avatar"
              />
            </div>
            <KidAvatarColorPicker
              value={avatarColor}
              onChange={setAvatarColor}
              compact
            />
            <label className="field" htmlFor={nameInputId}>
              <span className="label">First name</span>
              <input
                id={nameInputId}
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sam, Riley"
                required
                autoComplete="off"
              />
            </label>
          </div>
        </div>

        <footer className="strategy-modal-footer">
          <button type="button" className="btn secondary" onClick={closeModal}>
            Cancel
          </button>
          <button type="submit" className="btn primary add-account-submit">
            Add child
          </button>
        </footer>
      </form>
    </dialog>
  )

  const trigger =
    variant === 'standalone' ? (
      <button
        type="button"
        className="btn primary btn-lg add-child-standalone-cta"
        onClick={openModal}
        aria-haspopup="dialog"
      >
        {ctaLabel}
      </button>
    ) : (
      <li className="kid-grid-add-cell">
        <button
          type="button"
          className="card add-child-cta"
          onClick={openModal}
          aria-label="Add a child to your family"
          aria-haspopup="dialog"
        >
          <span className="add-child-cta-icon" aria-hidden>
            +
          </span>
          <span className="add-child-cta-label">{ctaLabel}</span>
        </button>
      </li>
    )

  return (
    <>
      {variant === 'standalone' ? (
        <div className="add-child-flow-standalone">{trigger}</div>
      ) : (
        trigger
      )}
      {createPortal(modal, document.body)}
    </>
  )
}
