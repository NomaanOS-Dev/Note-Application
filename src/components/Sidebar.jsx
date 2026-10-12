import {
  FileText,
  Pin,
  SlidersHorizontal,
  Star,
  Tag,
  Tags,
  Trash2,
  Archive,
} from 'lucide-react'
import { useState } from 'react'
import FolderTree from './FolderTree.jsx'

export default function Sidebar({
  active = 'All Notes',
  setActive = () => {},
  folders = [],
  categories = [],
  tags = [],
  notes = [],
}) {
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [foldersOpen, setFoldersOpen] = useState(true)
  const [tagsOpen, setTagsOpen] = useState(true)

  const activeNotes = notes.filter(note => !note.trashed && !note.archived)
  const archiveCount = notes.filter(note => note.archived && !note.trashed).length
  const trashCount = notes.filter(note => note.trashed).length

  const countFor = filter => {
    if (filter === 'All Notes') return activeNotes.length
    if (filter === 'Favorites') return activeNotes.filter(n => n.favorite).length
    if (filter === 'Pinned') return activeNotes.filter(n => n.pinned).length
    if (filter === 'Archive') return archiveCount
    if (filter === 'Trash') return trashCount

    if (filter.startsWith('Folder:')) {
      const path = filter.slice(7)
      return activeNotes.filter(n =>
        n.folder === path || n.folder?.startsWith(path + '/')
      ).length
    }

    if (filter.startsWith('Category:')) {
      return activeNotes.filter(n => n.category === filter.slice(9)).length
    }

    if (filter.startsWith('Tag:')) {
      return activeNotes.filter(n => (n.tags || []).includes(filter.slice(4))).length
    }

    return null
  }

  function NavItem({ label, icon: Icon, count, onClick, selected = false }) {
    return (
      <button
        type="button"
        className={`sidebar-nav-item ${selected ? 'sidebar-nav-item-active' : ''}`}
        onClick={onClick}
        aria-current={selected ? 'page' : undefined}
      >
        <Icon size={18} className="sidebar-nav-icon" />
        <span className="sidebar-nav-label">{label}</span>
        {count !== null && count !== undefined && (
          <span className="sidebar-nav-count">{count}</span>
        )}
      </button>
    )
  }

  function SectionHeading({ label, open, onToggle, count }) {
    return (
      <button        type="button"
        className="sidebar-section-heading"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span>{label}</span>
        <span className="sidebar-section-count">{count}</span>
        {open ? <span>▾</span> : <span>▸</span>}
      </button>
    )
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">🦁</div>
        <div className="sidebar-brand-name">NomaanOS</div>
      </div>

      <nav className="sidebar-navigation" aria-label="Main navigation">
        <div className="sidebar-primary-nav">
          <NavItem
            label="All Notes"
            icon={FileText}
            count={countFor('All Notes')}
            selected={active === 'All Notes'}
            onClick={() => setActive('All Notes')}
          />
          <NavItem
            label="Favorites"
            icon={Star}
            count={countFor('Favorites')}
            selected={active === 'Favorites'}
            onClick={() => setActive('Favorites')}
          />
          <NavItem
            label="Pinned"
            icon={Pin}
            count={countFor('Pinned')}
            selected={active === 'Pinned'}
            onClick={() => setActive('Pinned')}
          />
        </div>

        <div className="sidebar-section">
          <SectionHeading
            label="Folders"
            open={foldersOpen}
            onToggle={() => setFoldersOpen(v => !v)}
            count={folders.length}
          />
          {foldersOpen && (
            <div className="sidebar-section-items">
              {folders.length ? (
                <FolderTree
                  folders={folders}
                  active={active}
                  onSelect={setActive}
                  countFor={countFor}
                />
              ) : (
                <p className="sidebar-empty">Folders appear here.</p>
              )}
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <SectionHeading
            label="Categories"
            open={categoriesOpen}
            onToggle={() => setCategoriesOpen(v => !v)}
            count={categories.length}
          />
          {categoriesOpen && (
            <div className="sidebar-section-items">
              {categories.length ? (
                categories.map(cat => (
                  <NavItem
                    key={cat}
                    label={cat}
                    icon={Tags}
                    count={countFor(`Category:${cat}`)}
                    selected={active === `Category:${cat}`}
                    onClick={() => setActive(`Category:${cat}`)}
                  />
                ))
              ) : (
                <p className="sidebar-empty">Categories appear here.</p>
              )}
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <SectionHeading
            label="Tags"
            open={tagsOpen}
            onToggle={() => setTagsOpen(v => !v)}
            count={tags.length}
          />
          {tagsOpen && (
            <div className="sidebar-section-items">
              {tags.length ? (
                tags.map(tag => (
                  <NavItem
                    key={tag}
                    label={tag}
                    icon={Tag}
                    count={countFor(`Tag:${tag}`)}
                    selected={active === `Tag:${tag}`}
                    onClick={() => setActive(`Tag:${tag}`)}
                  />
                ))
              ) : (
                <p className="sidebar-empty">Tags appear when added to a note.</p>
              )}
            </div>
          )}
        </div>

        <div className="sidebar-bottom-nav">
          <NavItem
            label="Archive"
            icon={Archive}
            count={archiveCount}
            selected={active === 'Archive'}
            onClick={() => setActive('Archive')}
          />
          <NavItem
            label="Trash"
            icon={Trash2}
            count={trashCount}
            selected={active === 'Trash'}
            onClick={() => setActive('Trash')}
          />
          <NavItem
            label="Settings"
            icon={SlidersHorizontal}
            count={null}
            selected={active === 'Settings'}
            onClick={() => setActive('Settings')}
          />
        </div>
      </nav>

      <div className="sidebar-profile">
        <div className="sidebar-profile-status" />
        <div className="sidebar-profile-text">
          <span className="sidebar-profile-name">Nomaan</span>
          <span className="sidebar-profile-subtitle">Personal OS</span>
        </div>
      </div>
    </aside>
  )
}