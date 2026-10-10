import { MoreHorizontal, Star, Pin, Tag, Archive, ArchiveRestore, Trash2, RotateCcw, Lock } from 'lucide-react'

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
  unlocked,
}) {
  // If the note is unlocked, prefer its decrypted content over the stored metadata
  const display = unlocked ? { ...note, ...unlocked } : note
  const bodyText = textOnly(display.body || '')
  const isTrash = mode === 'trash'
  const isArchive = mode === 'archive'

  return (
    <article
      onClick={onClick}
      onKeyDown={event => event.key === 'Enter' && onClick()}
      tabIndex={0}
      role="button"
      className={`note-card note-${display.color || 'plain'} ${isTrash ? 'note-trashed' : ''}`}
    >
      <div className="note-card-heading">
        <h2>
          {display.title || 'Untitled note'}
          {note.locked && (
            <Lock
              size={12}
              style={{ marginLeft: 6, color: '#8d91a0', verticalAlign: 'middle' }}
              aria-label="Encrypted note"
            />
          )}
        </h2>
        <div className="card-actions">
          {mode === 'normal' && (
            <>
              <button
                className={`card-flag ${note.favorite ? 'flag-active' : ''}`}
                aria-label={note.favorite ? 'Remove favorite' : 'Add favorite'}
                title={note.favorite ? 'Remove favorite' : 'Add favorite'}
                onClick={event => {
                  event.stopPropagation()
                  onToggleFlag(note, 'favorite')
                }}
              >
                <Star size={15} fill={note.favorite ? 'currentColor' : 'none'} />
              </button>
              <button
                className={`card-flag ${note.pinned ? 'flag-active' : ''}`}
                aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
                title={note.pinned ? 'Unpin note' : 'Pin note'}
                onClick={event => {
                  event.stopPropagation()
                  onToggleFlag(note, 'pinned')
                }}
              >
                <Pin size={15} fill={note.pinned ? 'currentColor' : 'none'} />
              </button>
              <button
                className="card-flag"
                aria-label="Archive note"
                title="Archive note"
                onClick={event => {
                  event.stopPropagation()
                  onArchive(note)
                }}
              >
                <Archive size={15} />
              </button>
            </>
          )}
          {isArchive && (
            <button
              className="card-flag always-visible"
              aria-label="Restore from archive"
              title="Restore from archive"
              onClick={event => {
                event.stopPropagation()
                onRestore(note)
              }}
            >
              <ArchiveRestore size={16} />
            </button>
          )}
          {isTrash && (
            <>
              <button
                className="card-flag always-visible"
                aria-label="Restore note"
                title="Restore note"
                onClick={event => {
                  event.stopPropagation()
                  onRestore(note)
                }}
              >
                <RotateCcw size={16} />
              </button>
              <button
                className="card-flag always-visible danger-action"
                aria-label="Permanently delete note"
                title="Permanently delete note"
                onClick={event => {
                  event.stopPropagation()
                  onPermanentDelete(note)
                }}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
          {mode === 'normal' && (
            <button
              className="card-more"
              aria-label={`Edit ${display.title}`}
              onClick={event => {
                event.stopPropagation()
                onClick()
              }}
            >
              <MoreHorizontal size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="note-rule" />

      {/* Locked but not unlocked: show a placeholder */}
      {note.locked && !unlocked && (
        <p className="note-body" style={{ fontStyle: 'italic', opacity: 0.7 }}>
          🔒 This note is encrypted. Click to enter its password.
        </p>
      )}

      {/* Unlocked or normal note: render content */}
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
          {display.type === 'checklist' && (
            <div className="workout">
              <strong>Monday</strong>
              <p><span className="empty-check" />Yoga</p>
              <div className="scribble">〰</div>
              <strong>Tuesday</strong>
              <p><span className="empty-check" />Pilates</p>
              <p><span className="empty-check" />Walk home from office</p>
              <div className="scribble">〰</div>
              <strong>Wednesday</strong>
              <p><span className="empty-check" />Yoga</p>
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
          {display.category && (
            <span className="meta-chip category-chip">{display.category}</span>
          )}
          {display.folder && (
            <span className="meta-chip folder-chip">{display.folder}</span>
          )}
          {(display.tags || []).slice(0, 3).map(tag => (
            <span className="meta-chip tag-chip" key={tag}>
              <Tag size={10} />
              {tag}
            </span>
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
            : (note.updated || (note.updatedAt ? `Edited ${new Date(note.updatedAt).toLocaleDateString()}` : 'Note'))}
      </div>
    </article>
  )
}