import { useEffect, useRef, useState } from 'react'
import {
  Bold, Italic, Underline, List, ListOrdered,
  Trash2, X, Star, Pin, Lock, LockOpen, ImagePlus, RotateCcw,
} from 'lucide-react'
import { useDraftAutosave, loadDraft, clearDraft } from '../hooks/useDraftAutosave.js'
import { storeImageFile } from '../hooks/useImageStore.js'
import { useImageUrl } from '../hooks/useImageUrl.js'

const COLORS = [
  ['plain', 'Paper'], ['rose', 'Rose'], ['yellow', 'Butter'], ['blue', 'Sky'],
  ['green', 'Sage'], ['indigo', 'Periwinkle'], ['purple', 'Lilac'], ['cream', 'Cream'],
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
  const [images, setImages] = useState(note?.images || [])
  const [draftBanner, setDraftBanner] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const editor = useRef(null)
  const fileInput = useRef(null)

  useEffect(() => {
    const draft = loadDraft(note?.id)
    if (draft && (draft.title !== note?.title || draft.body !== note?.body)) {
      setDraftBanner(draft)
    }
  }, [note?.id])

  useEffect(() => {
    if (editor.current) editor.current.innerHTML = body
  }, [])

  const draftValue = {
    title, body, color, category, folder, tagsText,
    favorite, pinned, images,
  }
  useDraftAutosave(note?.id, draftValue, 2000)

  function restoreDraft() {
    if (!draftBanner) return
    setTitle(draftBanner.title || '')
    setBody(draftBanner.body || '')
    if (editor.current) editor.current.innerHTML = draftBanner.body || ''
    setColor(draftBanner.color || 'plain')
    setCategory(draftBanner.category || 'Personal')
    setFolder(draftBanner.folder || 'Notes')
    setTagsText(draftBanner.tagsText || '')
    setFavorite(Boolean(draftBanner.favorite))
    setPinned(Boolean(draftBanner.pinned))
    setImages(draftBanner.images || [])
    setDraftBanner(null)
  }

  if (lockedPreview) {
    return (
      <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
        <div className="note-modal" style={{ minHeight: 'auto', width: 'min(420px, 100%)' }}>
          <div className="modal-head">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Lock size={16} /> Encrypted note
            </span>
            <button type="button" className="icon-button" onClick={onClose}><X size={19} /></button>
          </div>
          <p style={{ color: '#8a8e9a', fontSize: 13, margin: '8px 0 20px' }}>
            This note is encrypted. Close this dialog and click the note again to enter its password.
          </p>
          <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="primary-button" onClick={onClose}>Close</button>
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

  async function insertImage(file) {
    const id = await storeImageFile(file)
    if (!id) return
    setImages(prev => [...prev, id])
    const url = URL.createObjectURL(file)
    editor.current?.focus()
    document.execCommand(
      'insertHTML',
      false,
      `<img src="${url}" alt="" style="max-width:100%;border-radius:10px;margin:8px 0;display:block" data-image-id="${id}" />`
    )
    setBody(editor.current?.innerHTML || '')
  }

  function handleFilePick(e) {
    const files = Array.from(e.target.files || [])
    files.forEach(insertImage)
    e.target.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files || [])
    files.filter(f => f.type.startsWith('image/')).forEach(insertImage)
  }

  async function handlePaste(e) {
    const items = Array.from(e.clipboardData?.items || [])
    const imageFiles = items.filter(i => i.type.startsWith('image/')).map(i => i.getAsFile())
    if (imageFiles.length) {
      e.preventDefault()
      for (const f of imageFiles) await insertImage(f)
    }
  }

  function removeImage(id) {
    setImages(prev => prev.filter(x => x !== id))
  }

  function buildPayload() {
    const html = editor.current?.innerHTML || ''
    const tags = [...new Set(tagsText.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean))]
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
      images,
    }
  }

  function submit(e) {
    e.preventDefault()
    if (!title.trim()) return

    const payload = buildPayload()

    if (payload.locked && !note?.locked) {
      onRequestLock(payload)
      return
    }

    clearDraft(note?.id)
    onSave(payload)
  }

  function handleCancel() {
  const hasContent = title.trim() || body.trim()
  if (hasContent) {
    const save = window.confirm('Save this note before closing?')
    if (save) {
      // trigger submit programmatically
      submit(new Event('submit'))
      return
    }
  }
  onClose()
}

  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && handleCancel()}>
      <form className="note-modal organization-modal" onSubmit={submit}>
        <div className="modal-head">
          <span>
            {note ? 'Edit note & organization' : 'Create a note'}
            {note?.locked && <span style={{ marginLeft: 8, color: '#8a8e9a', fontSize: 11 }}>🔒 encrypted</span>}
          </span>
          <button type="button" className="icon-button" onClick={handleCancel}><X size={19} /></button>
        </div>

        {draftBanner && (
          <div className="draft-banner">
            <RotateCcw size={14} />
            <span>You have an unsaved draft from earlier.</span>
            <button type="button" onClick={restoreDraft}>Restore</button>
            <button type="button" onClick={() => { clearDraft(note?.id); setDraftBanner(null) }}>Discard</button>
          </div>
        )}

        <input
          autoFocus
          className="editor-title"
          placeholder="Give your note a title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          maxLength={180}
        />

        <div className="editor-toolbar">
          {[[Bold, 'bold'], [Italic, 'italic'], [Underline, 'underline'], [List, 'insertUnorderedList'], [ListOrdered, 'insertOrderedList']].map(([Icon, cmd]) => (
            <button type="button" key={cmd} onClick={() => format(cmd)} aria-label={cmd}><Icon size={17} /></button>
          ))}
          <button type="button" onClick={() => fileInput.current?.click()} aria-label="Insert image">
            <ImagePlus size={17} />
          </button>
          <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={handleFilePick} />
        </div>

        <div
          ref={editor}
          className={`editor-body rich-editor ${dragOver ? 'drop-active' : ''}`}
          contentEditable
          role="textbox"
          aria-multiline="true"
          data-placeholder="Start writing whatever's on your mind..."
          onInput={e => setBody(e.currentTarget.innerHTML)}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onPaste={handlePaste}
        />

        {images.length > 0 && (
          <div className="image-strip">
            {images.map(id => <ImageStripItem key={id} id={id} onRemove={() => removeImage(id)} />)}
          </div>
        )}

        <div className="organization-fields">
          <div className="field-block color-field">
            <label>Note color</label>
            <div className="color-options">
              {COLORS.map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  title={label}
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
                onChange={e => setCategory(e.target.value)}
              />
              <datalist id="note-categories">
                {[...new Set([...DEFAULT_CATEGORIES, ...categories])].map(v => <option key={v} value={v} />)}
              </datalist>
            </div>

            <div className="field-block">
              <label htmlFor="note-folder">Folder <span>use / for nesting</span></label>
              <input
                id="note-folder"
                list="note-folders"
                value={folder}
                onChange={e => setFolder(e.target.value)}
                placeholder="Work/Projects/Q1"
              />
              <datalist id="note-folders">
                {[...new Set(['Notes', ...folders])].map(v => <option key={v} value={v} />)}
              </datalist>
            </div>
          </div>

          <div className="field-block">
            <label htmlFor="note-tags">Tags <span>separate with commas</span></label>
            <input
              id="note-tags"
              value={tagsText}
              onChange={e => setTagsText(e.target.value)}
            />
          </div>

          <div className="flag-options">
            <label className={`flag-option ${favorite ? 'flag-on' : ''}`}>
              <input type="checkbox" checked={favorite} onChange={e => setFavorite(e.target.checked)} />
              <Star size={16} fill={favorite ? 'currentColor' : 'none'} /> Favorite
            </label>
            <label className={`flag-option ${pinned ? 'flag-on' : ''}`}>
              <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} />
              <Pin size={16} fill={pinned ? 'currentColor' : 'none'} /> Pin
            </label>
            <label className={`flag-option ${locked ? 'flag-on' : ''}`}>
              <input type="checkbox" checked={locked} onChange={e => setLocked(e.target.checked)} />
              {locked ? <Lock size={16} /> : <LockOpen size={16} />} Lock note
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-footer-left">
            {note && (
              <button
                type="button"
                className="delete-button"
                onClick={() => window.confirm(`Delete "${note.title}"?`) && onDelete(note)}
              >
                <Trash2 size={15} /> Delete
              </button>
            )}
            <span>Changes save in this browser</span>
          </div>
          <button className="primary-button" type="submit">Save note</button>
        </div>
      </form>
    </div>
  )
}

function ImageStripItem({ id, onRemove }) {
  const url = useImageUrl(id)
  return (
    <div className="image-strip-item">
      {url ? <img src={url} alt="" /> : <div className="image-placeholder" />}
      <button type="button" onClick={onRemove} aria-label="Remove image">×</button>
    </div>
  )
}