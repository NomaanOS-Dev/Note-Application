// src/components/PasswordPrompt.jsx
import { useState } from 'react'
import { Lock, X } from 'lucide-react'

export default function PasswordPrompt({
  title = 'Enter password',
  description = 'This note is encrypted. Enter the password to unlock it.',
  confirm = false,
  onSubmit,
  onClose,
  error,
}) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setLocalError('')

    if (!password) {
      setLocalError('Password cannot be empty.')
      return
    }
    if (password.length < 4) {
      setLocalError('Use at least 4 characters.')
      return
    }
    if (confirm && password !== confirmPassword) {
      setLocalError('Passwords do not match.')
      return
    }

    onSubmit(password)
  }

  const message = error || localError

  return (
    <div
      className="modal-backdrop"
      onMouseDown={event => event.target === event.currentTarget && onClose()}
    >
      <form
        className="note-modal password-modal"
        onSubmit={handleSubmit}
        style={{ minHeight: 'auto', width: 'min(420px, 100%)' }}
      >
        <div className="modal-head">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Lock size={16} /> {title}
          </span>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        <p style={{ margin: '0 0 16px', color: '#8a8e9a', fontSize: 13 }}>
          {description}
        </p>

        <div className="field-block" style={{ marginBottom: 12 }}>
          <label htmlFor="lock-password">Password</label>
          <input
            id="lock-password"
            type="password"
            autoFocus
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>

        {confirm && (
          <div className="field-block" style={{ marginBottom: 12 }}>
            <label htmlFor="lock-password-confirm">Confirm password</label>
            <input
              id="lock-password-confirm"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
        )}

        {message && (
          <p
            style={{
              color: '#d05d65',
              fontSize: 12,
              margin: '4px 0 12px',
            }}
          >
            {message}
          </p>
        )}

        <div
          className="modal-footer"
          style={{ justifyContent: 'flex-end', gap: 8 }}
        >
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className="primary-button">
            {confirm ? 'Lock note' : 'Unlock'}
          </button>
        </div>
      </form>
    </div>
  )
}