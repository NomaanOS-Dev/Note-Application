import { Plus, Grid2X2, List, ArrowDownUp, Star, Archive, Trash2 } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import NoteCard from './NoteCard.jsx'

const titles = {
  'All Notes': ['All your notes', 'A clear mind starts with a place to put everything.'],
  'Favorites': ['Your favorites', 'The notes you want to find again quickly.'],
  'Pinned': ['Pinned notes', 'Keep your most important thoughts close.'],
  'Archive': ['Archive', 'Notes tucked away but never lost.'],
  'Trash': ['Trash', 'Deleted notes stay here until you permanently remove them.'],
}

export default function Dashboard({
  notes, view, setView, onNew, onOpen, active, sortBy, setSortBy,
  onToggleFlag, onArchive, onRestore, onTrash, onPermanentDelete, onEmptyTrash,
  onDuplicate, categoryFilter, setCategoryFilter, categories = [],
  unlockedNotes = {}, selectedIds = new Set(), onToggleSelect,
  reorderMode = false, onReorder,
}) {
  const isArchive = active === 'Archive'
  const isTrash = active === 'Trash'

  const heading = active.startsWith('Folder:') ? active.slice(7) :
    active.startsWith('Category:') ? active.slice(9) :
    active.startsWith('Tag:') ? `# ${active.slice(4)}` :
    (titles[active]?.[0] || active)

  const subtitle = active.startsWith('Folder:') ? 'Everything kept in this folder.' :
    active.startsWith('Category:') ? 'Notes grouped by category.' :
    active.startsWith('Tag:') ? 'Notes marked with this tag.' :
    (titles[active]?.[1] || 'A tidy space for all your thoughts.')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const isSortable = reorderMode && sortBy === 'manual' && !isArchive && !isTrash && view === 'grid'
  const ids = notes.map(n => n.id)

  function handleDragEnd(event) {
    const { active: dragged, over } = event
    if (!over || dragged.id === over.id) return
    const oldIndex = ids.indexOf(dragged.id)
    const newIndex = ids.indexOf(over.id)
    onReorder?.(arrayMove(ids, oldIndex, newIndex))
  }

  return (
    <section className="dashboard">
      <div className="welcome">
        <div>
          <small>✦ YOUR LITTLE CORNER OF THE INTERNET</small>
          <h1>{heading}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="welcome-actions">
          {isTrash && notes.length > 0 && (
            <button className="secondary-button danger-outline" onClick={onEmptyTrash}>
              <Trash2 size={15} /> Empty trash
            </button>
          )}
          {!isArchive && !isTrash && (
            <button className="primary-button" onClick={onNew}>
              <Plus size={17} /> New note
            </button>
          )}
        </div>
      </div>

      <div className="tools">
        <b>
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}{' '}
          <span>· Just for you</span>
        </b>
        <div className="tools-actions">
          {!isArchive && !isTrash && (
            <label className="category-filter">
              <span>Category</span>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="">All</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          )}
          <label className="sort-control">
            <ArrowDownUp size={15} />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              aria-label="Sort notes"
            >
              <option value="updated">Recently updated</option>
              <option value="created">Recently created</option>
              <option value="title">Title A–Z</option>
              <option value="color">By color</option>
              <option value="manual">Manual (drag)</option>
            </select>
          </label>
          {!isArchive && !isTrash && (
            <>
              <button
                className={`icon-button ${view === 'grid' ? 'selected' : ''}`}
                aria-label="Grid view"
                onClick={() => setView('grid')}
              >
                <Grid2X2 size={17} />
              </button>
              <button
                className={`icon-button ${view === 'list' ? 'selected' : ''}`}
                aria-label="List view"
                onClick={() => setView('list')}
              >
                <List size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {notes.length ? (
        isSortable ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={rectSortingStrategy}>
              <div className="notes-grid">
                {notes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={() => onOpen(note)}
                    onToggleFlag={onToggleFlag}
                    mode={isTrash ? 'trash' : isArchive ? 'archive' : 'normal'}
                    onArchive={onArchive}
                    onRestore={onRestore}
                    onTrash={onTrash}
                    onPermanentDelete={onPermanentDelete}
                    onDuplicate={onDuplicate}
                    unlocked={unlockedNotes[note.id]}
                    selected={selectedIds.has(note.id)}
                    onToggleSelect={onToggleSelect}
                    sortable
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className={view === 'grid' && !isArchive && !isTrash ? 'notes-grid' : 'notes-list'}>
            {notes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => onOpen(note)}
                onToggleFlag={onToggleFlag}
                mode={isTrash ? 'trash' : isArchive ? 'archive' : 'normal'}
                onArchive={onArchive}
                onRestore={onRestore}
                onTrash={onTrash}
                onPermanentDelete={onPermanentDelete}
                onDuplicate={onDuplicate}
                unlocked={unlockedNotes[note.id]}
                selected={selectedIds.has(note.id)}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </div>
        )
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            {isTrash ? <Trash2 size={24} /> : isArchive ? <Archive size={24} /> : <Star size={24} />}
          </div>
          <h2>
            {isTrash ? 'Trash is empty' : isArchive ? 'Nothing archived yet' : 'Nothing here just yet'}
          </h2>
          <p>
            {isTrash
              ? 'Notes you delete will appear here, where you can restore or permanently delete them.'
              : isArchive
                ? 'Archive notes you want to keep without seeing in your main workspace.'
                : 'Create a note or adjust your search to see something here.'}
          </p>
          {!isTrash && !isArchive && (
            <button className="primary-button" onClick={onNew}>
              <Plus size={16} /> Create a note
            </button>
          )}
        </div>
      )}

      {isTrash && notes.length > 0 && (
        <p className="trash-note">
          Items in Trash are stored in this browser until permanently deleted.
        </p>
      )}
    </section>
  )
}