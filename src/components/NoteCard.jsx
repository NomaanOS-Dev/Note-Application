import { useEffect, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  MoreHorizontal, Star, Pin, Tag, Archive, ArchiveRestore,
  Trash2, RotateCcw, Lock, Copy, GripVertical,
} from 'lucide-react'
import { useImageUrl } from '../hooks/useImageUrl.js'

function textOnly(html = '') {
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || div.innerText || '').trim()
}

export default function NoteCard({
  note,
  onClick,
  onToggleFlag,
  mode = 'normal',
  onArchive,
  onRestore,
  onTrash,
  onPermanentDelete,
  onDuplicate,
  unlocked,
  selected = false,
  onToggleSelect,
  sortable = false,
}) {
  const display = unlocked ? { ...note, ...unlocked } : note
  const bodyText = textOnly(display.body || '')
  const isTrash = mode === 'trash'
  const isArchive = mode === 'archive'

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id, disabled: !sortable })

  const style = sortable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined

  function handleSelectToggle(e) {
    e.stopPropagation()
    onToggleSelect?.(note.id)
  }

  return (
    <article
      ref={sortable ? setNodeRef : undefined}
      style={style}
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      tabIndex={0}
      role="button"
      className={`note-card note-${display.color || 'plain'} ${isTrash ? 'note-trashed' : ''} ${selected ? 'note-selected' : ''}`}
    >
      <div className="note-card-heading">
        {onToggleSelect && (
          <input
            type="checkbox"
            className="note-select-checkbox"
            checked={selected}
            onChange={handleSelectToggle}
            onClick={e => e.stopPropagation()}
            aria-label="Select note"
          />
        )}

        {sortable && (
          <button
            type="button"
            className="drag-handle"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
            onClick={e => e.stopPropagation()}
          >
            <GripVertical size={16} />
          </button>
        )}

        <h2>
          {display.title || 'Untitled note'}
          {note.locked && (
            <Lock size={12} style={{ marginLeft: 6, color: '#8d91a0', verticalAlign: 'middle' }} />
          )}
        </h2>

        <div className="card-actions">
          {mode === 'normal' && (
            <>
              <button
                className={`card-flag ${note.favorite ? 'flag-active' : ''}`}
                onClick={e => { e.stopPropagation(); onToggleFlag(note, 'favorite') }}
                aria-label="Favorite"
              >
                <Star size={15} fill={note.favorite ? 'currentColor' : 'none'} />
              </button>
              <button
                className={`card-flag ${note.pinned ? 'flag-active' : ''}`}
                onClick={e => { e.stopPropagation(); onToggleFlag(note, 'pinned') }}
                aria-label="Pin"
              >
                <Pin size={15} fill={note.pinned ? 'currentColor' : 'none'} />
              </button>
              <button
                className="card-flag"
                onClick={e => { e.stopPropagation(); onArchive(note) }}
                aria-label="Archive"
              >
                <Archive size={15} />
              </button>
            </>
          )}

          {isArchive && (
            <button
              className="card-flag always-visible"
              onClick={e => { e.stopPropagation(); onRestore(note) }}
              aria-label="Restore from archive"
            >
              <ArchiveRestore size={16} />
            </button>
          )}

          {isTrash && (
            <>
              <button
                className="card-flag always-visible"
                onClick={e => { e.stopPropagation(); onRestore(note) }}
                aria-label="Restore note"
              >
                <RotateCcw size={16} />
              </button>
              <button
                className="card-flag always-visible danger-action"
                onClick={e => { e.stopPropagation(); onPermanentDelete(note) }}
                aria-label="Delete forever"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}

          {mode === 'normal' && (
            <CardMenu
              onDuplicate={() => onDuplicate?.(note)}
              onTrash={() => onTrash(note)}
            />
          )}
        </div>
      </div>

      <div className="note-rule" />

      {display.images?.length > 0 && !note.locked && (
        <div className="note-images">
          {display.images.slice(0, 3).map(id => (
            <Thumbnail key={id} id={id} />
          ))}
          {display.images.length > 3 && (
            <div className="note-image-more">+{display.images.length - 3}</div>
          )}
        </div>
      )}

      {note.locked && !unlocked && (
        <p className="note-body" style={{ fontStyle: 'italic', opacity: 0.7 }}>
          🔒 This note is encrypted. Click to enter its password.
        </p>
      )}

      {(!note.locked || unlocked) && (
        <>
          {display.type === 'reading' && (
            <div className="reading-items">
              {(display.items || []).map(item => (
                <div className="reading-item" key={item.title}>
                  <span className={`item-swatch ${item.color || 'green'}`} />
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.subtitle}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
          {display.type === 'places' && (
            <div className="place-items">
              {(display.items || []).map(item => (
                <div className="place-item" key={item.title}>
                  <strong>{item.title}</strong>
                  <small>{item.subtitle}</small>
                </div>
              ))}
            </div>
          )}
          {display.type === 'list' && (
            <ol className="lecture-list">
              {bodyText.split('\n').map((line, index) => (
                <li key={`${line}-${index}`}>{line.replace(/^\d+\.\s*/, '')}</li>
              ))}
            </ol>
          )}
          {(display.type === 'text' || !display.type) && (
            <p className="note-body">{bodyText}</p>
          )}
        </>
      )}

      {(display.category || display.folder || (display.tags || []).length > 0) && (
        <div className="note-organization">
          {display.category && <span className="meta-chip category-chip">{display.category}</span>}
          {display.folder && <span className="meta-chip folder-chip">{display.folder}</span>}
          {(display.tags || []).slice(0, 3).map(tag => (
            <span className="meta-chip tag-chip" key={tag}><Tag size={10} />{tag}</span>
          ))}
          {(display.tags || []).length > 3 && (
            <span className="meta-chip">+{display.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="note-meta">
        {isTrash
          ? `Deleted ${note.deletedAt ? new Date(note.deletedAt).toLocaleDateString() : 'recently'}`
          : isArchive
            ? `Archived ${note.archivedAt ? new Date(note.archivedAt).toLocaleDateString() : 'recently'}`
            : (note.updated || 'Note')}
      </div>
    </article>
  )
}

function CardMenu({ onDuplicate, onTrash }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [open])

  return (
    <div className="card-menu-wrap" onClick={e => e.stopPropagation()}>
      <button
        className="card-more"
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        aria-label="More options"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div className="card-menu">
          <button onClick={onDuplicate}><Copy size={14} /> Duplicate</button>
          <button onClick={onTrash} className="danger"><Trash2 size={14} /> Move to Trash</button>
        </div>
      )}
    </div>
  )
}

function Thumbnail({ id }) {
  const url = useImageUrl(id)
  if (!url) return null
  return <img src={url} alt="" className="note-thumb" />
}