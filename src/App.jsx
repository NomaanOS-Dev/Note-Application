import { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import Dashboard from './components/Dashboard.jsx'
import NoteModal from './components/NoteModal.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import PasswordPrompt from './components/PasswordPrompt.jsx'
import BulkActionsBar from './components/BulkActionsBar.jsx'
import { encryptNote, decryptNote } from './utils/crypto.js'
import { deleteImage } from './utils/idb.js'

const STORAGE_KEY = 'notenest.notes.v1'
const SETTINGS_KEY = 'notenest.settings.v1'
const TRASH_TTL_DAYS = 30

function makeId() {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  } catch {}
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeNote(note) {
  return {
    category: 'Personal',
    folder: 'Notes',
    tags: [],
    favorite: false,
    pinned: false,
    archived: false,
    trashed: false,
    color: 'plain',
    locked: false,
    order: 0,
    images: [],
    ...note,
    tags: Array.isArray(note.tags) ? note.tags : [],
    images: Array.isArray(note.images) ? note.images : [],
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : { autoPurge: true, autoPurgeDays: TRASH_TTL_DAYS }
  } catch {
    return { autoPurge: true, autoPurgeDays: TRASH_TTL_DAYS }
  }
}

function loadNotes() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const notes = saved ? JSON.parse(saved) : []
    return notes.map(normalizeNote)
  } catch {
    return []
  }
}

function purgeOldTrash(notes, days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return notes.filter(note => {
    if (!note.trashed) return true
    const deleted = note.deletedAt ? new Date(note.deletedAt).getTime() : Date.now()
    return deleted > cutoff
  })
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [notes, setNotes] = useState(() => {
    const initial = loadNotes()
    return settings.autoPurge ? purgeOldTrash(initial, settings.autoPurgeDays) : initial
  })
  const [search, setSearch] = useState('')
  const [view, setView] = useState('grid')
  const [active, setActive] = useState('All Notes')
  const [editing, setEditing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState('updated')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const [passwordPrompt, setPasswordPrompt] = useState(null)
  const [unlockedNotes, setUnlockedNotes] = useState({})

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  // Reorder mode
  const [reorderMode, setReorderMode] = useState(false)

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('notenest.theme') || 'light'
    } catch {
      return 'light'
    }
  })

  const dark = theme === 'dark'

  useEffect(() => {
    try {
      localStorage.setItem('notenest.theme', theme)
    } catch {}
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.dataset.theme = theme
  }, [theme, dark])

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch {}
  }, [settings])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
    } catch (error) {
      console.error('Could not save notes in browser storage.', error)
    }
  }, [notes])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [active])

  const activeNotes = useMemo(
    () => notes.filter(note => !note.trashed && !note.archived),
    [notes]
  )

  const folders = useMemo(
    () => [...new Set(activeNotes.map(note => note.folder).filter(Boolean))].sort(),
    [activeNotes]
  )

  const categories = useMemo(
    () => [...new Set(
      notes.filter(note => !note.trashed).map(note => note.category).filter(Boolean)
    )].sort(),
    [notes]
  )

  const allTags = useMemo(
    () => [...new Set(activeNotes.flatMap(note => note.tags || []))].sort(),
    [activeNotes]
  )

  const visibleNotes = useMemo(() => {
    const term = search.trim().toLowerCase()

    const source =
      active === 'Archive'
        ? notes.filter(note => note.archived && !note.trashed)
        : active === 'Trash'
          ? notes.filter(note => note.trashed)
          : notes.filter(note => !note.archived && !note.trashed)

    const filtered = source.filter(note => {
      const searchable = [
        note.title,
        note.locked ? '' : note.body,
        note.category,
        note.folder,
        ...(note.tags || []),
        ...(note.items || []).flatMap(item => [item.title, item.subtitle]),
      ]
        .join(' ')
        .replace(/<[^>]*>/g, ' ')
        .toLowerCase()

      const matchesSearch = searchable.includes(term)
      const matchesCategory = !categoryFilter || note.category === categoryFilter

      const matchesActive =
        ['All Notes', 'All Docs'].includes(active) ? true :
          active === 'Favorites' ? note.favorite :
            active === 'Pinned' ? note.pinned :
              active === 'Untagged' ? !(note.tags || []).length :
                active === 'Archive' || active === 'Trash' ? true :
                  active.startsWith('Folder:') ? (
                    note.folder === active.slice(7) ||
                    note.folder?.startsWith(active.slice(7) + '/')
                  ) :
                    active.startsWith('Category:') ? note.category === active.slice(9) :
                      active.startsWith('Tag:') ? (note.tags || []).includes(active.slice(4)) :
                        true

      return matchesSearch && matchesCategory && matchesActive
    })

    return [...filtered].sort((a, b) => {
      if (active === 'Trash') {
        return new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0)
      }

      if (sortBy === 'manual') {
        return (a.order ?? 0) - (b.order ?? 0)
      }

      if (a.pinned !== b.pinned && !['Archive', 'Trash'].includes(active)) {
        return a.pinned ? -1 : 1
      }

      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '')
      if (sortBy === 'created') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      if (sortBy === 'color') return (a.color || '').localeCompare(b.color || '')

      return new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0)
    })
  }, [notes, search, active, sortBy, categoryFilter])

  async function saveNote(note) {
    const now = new Date().toISOString()

    if (note.locked) {
      const password = note.__password
      if (!password) return

      const encrypted = await encryptNote(note, password)
      const meta = normalizeNote({
        ...note,
        title: '🔒 Locked note',
        body: '',
        tags: [],
        images: [],
        items: [],
        type: 'text',
        locked: true,
        encrypted,
        updatedAt: now,
        updated: 'Encrypted just now',
      })
      delete meta.__password
      delete meta.decrypted

      if (note.id) {
        setNotes(cur => cur.map(n => (n.id === note.id ? { ...n, ...meta } : n)))
        const { __password, ...safe } = note
        setUnlockedNotes(cur => ({ ...cur, [note.id]: { ...safe, locked: true } }))
      } else {
        const id = makeId()
        setNotes(cur => [{ ...meta, id, createdAt: now, order: Date.now() }, ...cur])
        const { __password, ...safe } = note
        setUnlockedNotes(cur => ({ ...cur, [id]: { ...safe, id, locked: true } }))
      }
    } else {
      const normalized = normalizeNote({
        ...note,
        updatedAt: now,
        updated: 'Edited just now',
      })
      delete normalized.__password
      delete normalized.encrypted

      if (note.id) {
        setNotes(cur => cur.map(n => (n.id === note.id ? { ...n, ...normalized } : n)))
        setUnlockedNotes(cur => {
          const next = { ...cur }
          delete next[note.id]
          return next
        })
      } else {
        setNotes(cur => [
          { ...normalized, id: makeId(), createdAt: now, order: Date.now() },
          ...cur,
        ])
      }
    }

    setModalOpen(false)
    setEditing(null)
  }

  function deleteNote(note) {
    setNotes(cur => cur.map(n => n.id === note.id
      ? { ...n, trashed: true, archived: false, deletedAt: new Date().toISOString() }
      : n))
    setModalOpen(false)
    setEditing(null)
  }

  function toggleFlag(note, field) {
    setNotes(cur => cur.map(n => n.id === note.id
      ? { ...n, [field]: !n[field], updatedAt: new Date().toISOString() }
      : n))
  }

  function archiveNote(note) {
    setNotes(cur => cur.map(n => n.id === note.id
      ? { ...n, archived: true, trashed: false, archivedAt: new Date().toISOString() }
      : n))
  }

  function restoreNote(note) {
    setNotes(cur => cur.map(n => n.id === note.id
      ? {
          ...n,
          archived: false,
          trashed: false,
          deletedAt: null,
          archivedAt: null,
          updatedAt: new Date().toISOString(),
        }
      : n))
  }

  function moveToTrash(note) {
    setNotes(cur => cur.map(n => n.id === note.id
      ? { ...n, trashed: true, archived: false, deletedAt: new Date().toISOString() }
      : n))
  }

  async function permanentlyDelete(note) {
    if (!window.confirm(`Permanently delete "${note.title}"? This cannot be undone.`)) return
    for (const id of note.images || []) {
      try { await deleteImage(id) } catch {}
    }
    setNotes(cur => cur.filter(n => n.id !== note.id))
    setUnlockedNotes(cur => {
      const next = { ...cur }
      delete next[note.id]
      return next
    })
  }

  function emptyTrash() {
    if (!window.confirm('Permanently delete all notes in Trash? This cannot be undone.')) return
    setNotes(cur => cur.filter(n => !n.trashed))
    setUnlockedNotes({})
  }

  function duplicateNote(note) {
    const copy = {
      ...note,
      id: makeId(),
      title: `${note.title || 'Untitled'} (copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updated: 'Duplicated just now',
      order: Date.now(),
      favorite: false,
      pinned: false,
    }
    delete copy.encrypted
    delete copy.__password

    if (note.locked) {
      copy.locked = false
      copy.title = `${note.title} (copy)`
    }

    setNotes(cur => [copy, ...cur])
  }

  function reorderNotes(orderedIds) {
    setNotes(cur => {
      const indexOf = new Map(orderedIds.map((id, i) => [id, i]))
      return cur.map(n => indexOf.has(n.id) ? { ...n, order: indexOf.get(n.id) } : n)
    })
  }

  function toggleSelect(id) {
    setSelectedIds(cur => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  function bulkFavorite() {
    setNotes(cur => cur.map(n =>
      selectedIds.has(n.id) ? { ...n, favorite: true, updatedAt: new Date().toISOString() } : n
    ))
    clearSelection()
  }

  function bulkPin() {
    setNotes(cur => cur.map(n =>
      selectedIds.has(n.id) ? { ...n, pinned: true, updatedAt: new Date().toISOString() } : n
    ))
    clearSelection()
  }

  function bulkAddTag() {
    const tag = window.prompt('Tag name to add to selected notes:')
    if (!tag) return
    const clean = tag.trim().replace(/^#/, '')
    setNotes(cur => cur.map(n => {
      if (!selectedIds.has(n.id)) return n
      const tags = new Set([...(n.tags || []), clean])
      return { ...n, tags: [...tags], updatedAt: new Date().toISOString() }
    }))
    clearSelection()
  }

  function bulkArchive() {
    setNotes(cur => cur.map(n => selectedIds.has(n.id)
      ? { ...n, archived: true, trashed: false, archivedAt: new Date().toISOString() }
      : n))
    clearSelection()
  }

  function bulkTrash() {
    setNotes(cur => cur.map(n => selectedIds.has(n.id)
      ? { ...n, trashed: true, archived: false, deletedAt: new Date().toISOString() }
      : n))
    clearSelection()
  }

  function bulkRestore() {
    setNotes(cur => cur.map(n => selectedIds.has(n.id)
      ? { ...n, archived: false, trashed: false, deletedAt: null, archivedAt: null }
      : n))
    clearSelection()
  }

  function bulkDeleteForever() {
    if (!window.confirm(`Permanently delete ${selectedIds.size} notes?`)) return
    setNotes(cur => cur.filter(n => !selectedIds.has(n.id)))
    clearSelection()
  }

  function newNote() {
    setEditing(null)
    setModalOpen(true)
    setMobileNavOpen(false)
  }

  function selectNavigation(value) {
    setActive(value)
    setCategoryFilter('')
    setMobileNavOpen(false)
  }

  function openNote(note) {
    if (note.locked) {
      const decrypted = unlockedNotes[note.id]
      if (!decrypted) {
        setPasswordPrompt({ mode: 'unlock', note })
        return
      }
      setEditing({ ...note, ...decrypted, locked: true })
    } else {
      setEditing(note)
    }
    setModalOpen(true)
    setMobileNavOpen(false)
  }

  function requestLockNote(noteDraft) {
    setPasswordPrompt({ mode: 'set', note: noteDraft })
  }

  async function handlePasswordSubmit(password) {
    const prompt = passwordPrompt
    if (!prompt) return

    if (prompt.mode === 'set') {
      const draft = { ...prompt.note, locked: true, __password: password }
      setPasswordPrompt(null)
      await saveNote(draft)
      return
    }

    if (prompt.mode === 'unlock') {
      try {
        const decrypted = await decryptNote(prompt.note.encrypted, password)
        setUnlockedNotes(cur => ({ ...cur, [prompt.note.id]: decrypted }))
        setPasswordPrompt(null)
        setEditing({ ...prompt.note, ...decrypted, locked: true })
        setModalOpen(true)
      } catch {
        setPasswordPrompt(p => ({ ...p, error: 'Wrong password. Try again.' }))
      }
    }
  }

  const editingLockedSealed = Boolean(
    editing && editing.locked && !unlockedNotes[editing.id]
  )

  const selectionCount = selectedIds.size
  const selectionMode = active === 'Trash' ? 'trash' : active === 'Archive' ? 'archive' : 'normal'

  return (
    <div className={`app-shell ${dark ? 'app-dark' : ''} ${theme === 'lavender' ? 'app-lavender' : ''}`}>
      {mobileNavOpen && (
        <button
          type="button"
          className="mobile-nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <div className={`sidebar-wrap ${mobileNavOpen ? 'sidebar-wrap-open' : ''}`}>
        <Sidebar
          active={active}
          setActive={selectNavigation}
          folders={folders}
          categories={categories}
          tags={allTags}
          notes={notes}
        />
      </div>

      <main className="main-panel">
        <Topbar
          search={search}
          setSearch={setSearch}
          view={view}
          setView={setView}
          dark={dark}
          setDark={v => setTheme(v ? 'dark' : 'light')}
          onNew={newNote}
          onMenu={() => setMobileNavOpen(o => !o)}
          reorderMode={reorderMode}
          setSortBy={setSortBy}
          setReorderMode={setReorderMode}
        />

        {selectionCount > 0 && (
          <BulkActionsBar
            count={selectionCount}
            onClear={clearSelection}
            mode={selectionMode}
            onFavorite={bulkFavorite}
            onPin={bulkPin}
            onAddTag={bulkAddTag}
            onArchive={bulkArchive}
            onTrash={selectionMode === 'trash' ? bulkDeleteForever : bulkTrash}
            onRestore={bulkRestore}
          />
        )}

        {active === 'Settings' ? (
          <SettingsPanel
            theme={theme}
            setTheme={setTheme}
            notes={notes}
            settings={settings}
            setSettings={setSettings}
            onEmptyTrash={emptyTrash}
          />
        ) : (
          <Dashboard
            notes={visibleNotes}
            view={view}
            setView={setView}
            onNew={newNote}
            onOpen={openNote}
            active={active}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onToggleFlag={toggleFlag}
            onArchive={archiveNote}
            onRestore={restoreNote}
            onTrash={moveToTrash}
            onPermanentDelete={permanentlyDelete}
            onEmptyTrash={emptyTrash}
            onDuplicate={duplicateNote}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            categories={categories}
            unlockedNotes={unlockedNotes}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            reorderMode={reorderMode}
            onReorder={reorderNotes}
          />
        )}

        <div className="save-status">
          ✓ Start your first log
        </div>
      </main>

      {modalOpen && (
        <NoteModal
          note={editing}
          lockedPreview={editingLockedSealed}
          folders={folders}
          categories={categories}
          allTags={allTags}
          onClose={() => {
            setModalOpen(false)
            setEditing(null)
          }}
          onSave={saveNote}
          onDelete={deleteNote}
          onRequestLock={requestLockNote}
        />
      )}

      {passwordPrompt && (
        <PasswordPrompt
          title={passwordPrompt.mode === 'set' ? 'Lock this note' : 'Unlock note'}
          description={
            passwordPrompt.mode === 'set'
              ? 'Set a password. The note will be encrypted in your browser. If you forget it, the note cannot be recovered.'
              : 'This note is encrypted. Enter its password to open it.'
          }
          confirm={passwordPrompt.mode === 'set'}
          error={passwordPrompt.error}
          onSubmit={handlePasswordSubmit}
          onClose={() => setPasswordPrompt(null)}
        />
      )}
    </div>
  )
}