import { useEffect, useRef, useState } from 'react'
import {
  Bold, Italic, Underline, List, ListOrdered,
  Trash2, X, Star, Pin, Lock, LockOpen
} from 'lucide-react'

const COLORS = [
  ['plain', 'Paper'], ['rose', 'Rose'], ['yellow', 'Butter'], ['blue', 'Sky'],
  ['green', 'Sage'], ['indigo', 'Periwinkle'], ['purple', 'Lilac'], ['cream', 'Cream']
]
const DEFAULT_CATEGORIES = ['Personal', 'Work', 'Ideas', 'Learning', 'Travel']

function plainText(html = '') {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

export default function NoteModal({
  note,
  lockedPreview = false,
  folders = [],
  categories = [],
  allTags = [],
  onClose,
  onSave,
  onDelete,
  onRequestLock,
}) {
  const [title, setTitle] = useState(note?.title || '')
  const [body, setBody] = useState(note?.body || '')
  const [color, setColor] = useState(note?.color || 'plain')
  const [category, setCategory] = useState(note?.category || 'Personal')
  const [folder, setFolder] = useState(note?.folder || 'Notes')
  const [tagsText, setTagsText] = useState((note?.tags || []).join(', '))
  const [favorite, setFavorite] = useState(Boolean(note?.favorite))
  const [pinned, setPinned] = useState(Boolean(note?.pinned))
  const [locked, setLocked] = useState(Boolean(note?.locked))

  const editor = useRef(null)

  useEffect(() => {
    if (editor.current) editor.current.innerHTML = body
  }, [])

  // 🔒 Hard guard: a locked-but-sealed note should never render editable
  if (lockedPreview) {
    return (
      <div
        className="modal-backdrop"
        onMouseDown={event => event.target === event.currentTarget && onClose()}
      >
        <div
          className="note-modal"
          style={{ minHeight: 'auto', width: 'min(420px, 100%)' }}
        >
          <div className="modal-head">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Lock size={16} /> Encrypted note
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
          <p style={{ color: '#8a8e9a', fontSize: 13, margin: '8px 0 20px' }}>
            This note is encrypted. Close this dialog and click the note again to enter its password.
          </p>
          <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="primary-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  function format(command) {
    editor.current?.focus()
    document.execCommand(command, false)
    setBody(editor.current?.innerHTML || '')
  }

  function buildPayload() {
    const html = editor.current?.innerHTML || ''
    const tags = [...new Set(
      tagsText.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(Boolean)
    )]
    return {
      ...note,
      title: title.trim(),
      body: plainText(html).trim() ? html : '',
      color,
      category: category.trim() || 'Personal',
      folder: folder.trim() || 'Notes',
      tags,
      favorite,
      pinned,
      locked,
    }
  }

  function submit(event) {
    event.preventDefault()
    if (!title.trim()) return

    const payload = buildPayload()

    // If we're locking a note that was NOT locked before → ask for password
    if (payload.locked && !note?.locked) {
      onRequestLock(payload)
      return
    }

    onSave(payload)
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={event => event.target === event.currentTarget && onClose()}
    >
      <form className="note-modal organization-modal" onSubmit={submit}>
        <div className="modal-head">
          <span>
            {note ? 'Edit note & organization' : 'Create a note'}
            {note?.locked && (
              <span style={{ marginLeft: 8, color: '#8a8e9a', fontSize: 11 }}>
                🔒 encrypted
              </span>
            )}
          </span>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close editor"
          >
            <X size={19} />
          </button>
        </div>

        <input
          autoFocus
          className="editor-title"
          placeholder="Give your note a title..."
          value={title}
          onChange={event => setTitle(event.target.value)}
          required
          maxLength={180}
        />

        <div className="editor-toolbar">
          {[[Bold, 'bold'], [Italic, 'italic'], [Underline, 'underline'], [List, 'insertUnorderedList'], [ListOrdered, 'insertOrderedList']].map(([Icon, command]) => (
            <button
              type="button"
              key={command}
              onClick={() => format(command)}
              aria-label={command}
            >
              <Icon size={17} />
            </button>
          ))}
        </div>

        <div
          ref={editor}
          className="editor-body rich-editor"
          contentEditable
          role="textbox"
          aria-label="Note content"
          aria-multiline="true"
          data-placeholder="Start writing whatever's on your mind..."
          onInput={event => setBody(event.currentTarget.innerHTML)}
        />

        <div className="organization-fields">
          <div className="field-block color-field">
            <label>Note color</label>
            <div className="color-options">
              {COLORS.map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  title={label}
                  aria-label={label}
                  className={`color-swatch swatch-${value} ${color === value ? 'chosen' : ''}`}
                  onClick={() => setColor(value)}
                />
              ))}
            </div>
          </div>

          <div className="organization-row">
            <div className="field-block">
              <label htmlFor="note-category">Category</label>
              <input
                id="note-category"
                list="note-categories"
                value={category}
                onChange={event => setCategory(event.target.value)}
                placeholder="e.g. Work"
              />
              <datalist id="note-categories">
                {[...new Set([...DEFAULT_CATEGORIES, ...categories])].map(value => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </div>
            <div className="field-block">
              <label htmlFor="note-folder">Folder</label>
              <input
                id="note-folder"
                list="note-folders"
                value={folder}
                onChange={event => setFolder(event.target.value)}
                placeholder="e.g. Projects"
              />
              <datalist id="note-folders">
                {[...new Set(['Notes', ...folders])].map(value => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="field-block">
            <label htmlFor="note-tags">
              Tags <span>separate with commas</span>
            </label>
            <input
              id="note-tags"
              value={tagsText}
              onChange={event => setTagsText(event.target.value)}
              placeholder="design, ideas, read-later"
            />
            {allTags.length > 0 && (
              <small className="tag-suggestions">
                Existing tags: {allTags.slice(0, 8).join(' · ')}
              </small>
            )}
          </div>

          <div className="flag-options">
            <label className={`flag-option ${favorite ? 'flag-on' : ''}`}>
              <input
                type="checkbox"
                checked={favorite}
                onChange={event => setFavorite(event.target.checked)}
              />
              <Star size={16} fill={favorite ? 'currentColor' : 'none'} /> Favorite
            </label>
            <label className={`flag-option ${pinned ? 'flag-on' : ''}`}>
              <input
                type="checkbox"
                checked={pinned}
                onChange={event => setPinned(event.target.checked)}
              />
              <Pin size={16} fill={pinned ? 'currentColor' : 'none'} /> Pin to top
            </label>

            <label className={`flag-option ${locked ? 'flag-on' : ''}`}>
              <input
                type="checkbox"
                checked={locked}
                onChange={event => setLocked(event.target.checked)}
              />
              {locked ? <Lock size={16} /> : <LockOpen size={16} />}
              {note?.locked ? (locked ? 'Encrypted' : 'Remove lock') : 'Lock note'}
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-footer-left">
            {note && (
              <button
                type="button"
                className="delete-button"
                onClick={() => {
                  if (window.confirm(`Delete "${note.title}"? This cannot be undone.`)) {
                    onDelete(note)
                  }
                }}
              >
                <Trash2 size={15} /> Delete
              </button>
            )}
            <span>Changes save in this browser</span>
          </div>
          <button className="primary-button" type="submit">
            Save note
          </button>
        </div>
      </form>
    </div>
  )
}