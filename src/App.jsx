import { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import Dashboard from './components/Dashboard.jsx'
import NoteModal from './components/NoteModal.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import PasswordPrompt from './components/PasswordPrompt.jsx'
import { encryptNote, decryptNote } from './utils/crypto.js'

const STORAGE_KEY = 'notenest.notes.v1'

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
    ...note,
    tags: Array.isArray(note.tags) ? note.tags : [],
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

export default function App() {
  const [notes, setNotes] = useState(loadNotes)
  const [search, setSearch] = useState('')
  const [view, setView] = useState('grid')
  const [active, setActive] = useState('All Notes')
  const [editing, setEditing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState('updated')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // 🔐 Password prompt state
  const [passwordPrompt, setPasswordPrompt] = useState(null)
  // { mode: 'set' | 'unlock', note }

  // 🔓 In-memory unlocked decrypted content per note id
  const [unlockedNotes, setUnlockedNotes] = useState({})

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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
    } catch (error) {
      console.error('Could not save notes in browser storage.', error)
    }
  }, [notes])

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
                  active.startsWith('Folder:') ? note.folder === active.slice(7) :
                    active.startsWith('Category:') ? note.category === active.slice(9) :
                      active.startsWith('Tag:') ? (note.tags || []).includes(active.slice(4)) :
                        true

      return matchesSearch && matchesCategory && matchesActive
    })

    return [...filtered].sort((a, b) => {
      if (active === 'Trash') {
        return new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0)
      }

      if (a.pinned !== b.pinned && !['Archive', 'Trash'].includes(active)) {
        return a.pinned ? -1 : 1
      }

      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '')
      }

      if (sortBy === 'created') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      }

      if (sortBy === 'color') {
        return (a.color || '').localeCompare(b.color || '')
      }

      return new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0)
    })
  }, [notes, search, active, sortBy, categoryFilter])

  async function saveNote(note) {
    const now = new Date().toISOString()

    // 🔐 Locked note — encrypt and strip all plaintext
    if (note.locked) {
      const password = note.__password
      if (!password) return

      const encrypted = await encryptNote(note, password)

      const meta = normalizeNote({
        ...note,
        title: '🔒 Locked note',
        body: '',
        tags: [],
        items: [],
        type: 'text',
        locked: true,
        encrypted,
        updatedAt: now,
        updated: 'Encrypted just now',
        archived: note.archived || false,
        trashed: false,
      })
      delete meta.__password
      delete meta.decrypted

      if (note.id) {
        setNotes(current =>
          current.map(item =>
            item.id === note.id ? { ...item, ...meta } : item
          )
        )
        const { __password, ...safeDraft } = note
        setUnlockedNotes(current => ({
          ...current,
          [note.id]: { ...safeDraft, locked: true },
        }))
      } else {
        const id = globalThis.crypto?.randomUUID?.() || String(Date.now())
        const newNote = { ...meta, id, createdAt: now }
        setNotes(current => [newNote, ...current])
        const { __password, ...safeDraft } = note
        setUnlockedNotes(current => ({
          ...current,
          [id]: { ...safeDraft, id, locked: true },
        }))
      }
    } else {
      // Normal unencrypted save
      const normalized = normalizeNote({
        ...note,
        updatedAt: now,
        updated: 'Edited just now',
        archived: note.archived || false,
        trashed: false,
      })
      delete normalized.__password
      delete normalized.encrypted

      if (note.id) {
        setNotes(current =>
          current.map(item =>
            item.id === note.id ? { ...item, ...normalized } : item
          )
        )
        setUnlockedNotes(current => {
          const next = { ...current }
          delete next[note.id]
          return next
        })
      } else {
        setNotes(current => [
          {
            ...normalized,
            id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
            createdAt: now,
            updatedAt: now,
            updated: 'Created just now',
            type: 'text',
            items: [],
          },
          ...current,
        ])
      }
    }

    setModalOpen(false)
    setEditing(null)
  }

  function deleteNote(note) {
    setNotes(current =>
      current.map(item =>
        item.id === note.id
          ? { ...item, trashed: true, archived: false, deletedAt: new Date().toISOString() }
          : item
      )
    )
    setModalOpen(false)
    setEditing(null)
  }

  function toggleFlag(note, field) {
    setNotes(current =>
      current.map(item =>
        item.id === note.id
          ? { ...item, [field]: !item[field], updatedAt: new Date().toISOString() }
          : item
      )
    )
  }

  function archiveNote(note) {
    setNotes(current =>
      current.map(item =>
        item.id === note.id
          ? { ...item, archived: true, trashed: false, archivedAt: new Date().toISOString() }
          : item
      )
    )
  }

  function restoreNote(note) {
    setNotes(current =>
      current.map(item =>
        item.id === note.id
          ? {
              ...item,
              archived: false,
              trashed: false,
              deletedAt: null,
              archivedAt: null,
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    )
  }

  function moveToTrash(note) {
    setNotes(current =>
      current.map(item =>
        item.id === note.id
          ? { ...item, trashed: true, archived: false, deletedAt: new Date().toISOString() }
          : item
      )
    )
  }

  function permanentlyDelete(note) {
    if (window.confirm(`Permanently delete "${note.title}"? This cannot be undone.`)) {
      setNotes(current => current.filter(item => item.id !== note.id))
      setUnlockedNotes(current => {
        const next = { ...current }
        delete next[note.id]
        return next
      })
    }
  }

  function emptyTrash() {
    if (window.confirm('Permanently delete all notes in Trash? This cannot be undone.')) {
      setNotes(current => current.filter(item => !item.trashed))
      setUnlockedNotes({})
    }
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

  // 🔐 Open a note — locked notes must be unlocked first
  function openNote(note) {
    if (note.locked) {
      const decrypted = unlockedNotes[note.id]
      if (!decrypted) {
        setPasswordPrompt({ mode: 'unlock', note })
        return
      }
      setEditing({ ...note, ...decrypted, locked: true })
      setModalOpen(true)
      setMobileNavOpen(false)
      return
    }

    setEditing(note)
    setModalOpen(true)
    setMobileNavOpen(false)
  }

  // 🔐 Called from NoteModal when user toggles "Lock note" and clicks Save
  function requestLockNote(noteDraft) {
    setPasswordPrompt({
      mode: 'set',
      note: noteDraft,
    })
  }

  // 🔐 Handle password prompt submit
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
        setUnlockedNotes(current => ({
          ...current,
          [prompt.note.id]: decrypted,
        }))
        setPasswordPrompt(null)
        setEditing({ ...prompt.note, ...decrypted, locked: true })
        setModalOpen(true)
      } catch (err) {
        setPasswordPrompt(p => ({ ...p, error: 'Wrong password. Try again.' }))
      }
    }
  }

  const editingLockedSealed = Boolean(
    editing && editing.locked && !unlockedNotes[editing.id]
  )

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
          setDark={value => setTheme(value ? 'dark' : 'light')}
          onNew={newNote}
          onMenu={() => setMobileNavOpen(open => !open)}
        />

        {active === 'Settings' ? (
          <SettingsPanel
            theme={theme}
            setTheme={setTheme}
            notes={notes}
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
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            categories={categories}
            unlockedNotes={unlockedNotes}
          />
        )}

        <div className="save-status">
          ✓ Notes, archive, and trash are saved in this browser
        </div>
      </main>

      {modalOpen && editing && (
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