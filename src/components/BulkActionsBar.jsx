// src/components/BulkActionsBar.jsx
import { X, Archive, Trash2, RotateCcw, Tag, Star, Pin } from 'lucide-react'

export default function BulkActionsBar({
  count,
  onClear,
  onArchive,
  onTrash,
  onRestore,
  onFavorite,
  onPin,
  onAddTag,
  mode = 'normal',
}) {
  if (!count) return null

  return (
    <div className="bulk-actions-bar">
      <div className="bulk-actions-info">
        <button type="button" className="icon-button" onClick={onClear} aria-label="Clear selection">
          <X size={16} />
        </button>
        <strong>{count} selected</strong>
      </div>

      <div className="bulk-actions-buttons">
        {mode === 'normal' && (
          <>
            <button type="button" className="secondary-button" onClick={onFavorite}>
              <Star size={15} /> Favorite
            </button>
            <button type="button" className="secondary-button" onClick={onPin}>
              <Pin size={15} /> Pin
            </button>
            <button type="button" className="secondary-button" onClick={onAddTag}>
              <Tag size={15} /> Tag
            </button>
            <button type="button" className="secondary-button" onClick={onArchive}>
              <Archive size={15} /> Archive
            </button>
          </>
        )}

        {mode === 'archive' && (
          <button type="button" className="secondary-button" onClick={onRestore}>
            <RotateCcw size={15} /> Restore
          </button>
        )}

        {(mode === 'normal' || mode === 'archive') && (
          <button type="button" className="secondary-button danger-outline" onClick={onTrash}>
            <Trash2 size={15} /> Trash
          </button>
        )}

        {mode === 'trash' && (
          <>
            <button type="button" className="secondary-button" onClick={onRestore}>
              <RotateCcw size={15} /> Restore
            </button>
            <button type="button" className="secondary-button danger-outline" onClick={onTrash}>
              <Trash2 size={15} /> Delete forever
            </button>
          </>
        )}
      </div>
    </div>
  )
}