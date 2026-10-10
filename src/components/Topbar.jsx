
import {
  Search,
  Moon,
  Sun,
  Bell,
  Plus,
  Menu,
  LayoutGrid,
  List,
} from 'lucide-react'

export default function Topbar({
  search,
  setSearch,
  view,
  setView,
  dark,
  setDark,
  onNew,
  onMenu,
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="icon-button mobile-menu"
          onClick={onMenu}
          aria-label="Open navigation"
          title="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="search-box">
          <Search size={18} />

          <input
            type="search"
            placeholder="Search your notes..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            aria-label="Search notes"
          />

          <kbd>⌘ K</kbd>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="view-switch" aria-label="Note layout">
          <button
            type="button"
            className={view === 'grid' ? 'active' : ''}
            onClick={() => setView('grid')}
            aria-label="Grid view"
            title="Grid view"
          >
            <LayoutGrid size={18} />
          </button>

          <button
            type="button"
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
            aria-label="List view"
            title="List view"
          >
            <List size={18} />
          </button>
        </div>

        <button
          type="button"
          className="icon-button theme-toggle"
          onClick={() => setDark(!dark)}
          aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={dark ? 'Light mode' : 'Dark mode'}
        >
          {dark ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <button
          type="button"
          className="icon-button notification-button"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={19} />
        </button>

        <button
          type="button"
          className="new-note-button"
          onClick={onNew}
        >
          <Plus size={18} />
          <span>New Note</span>
        </button>
      </div>
    </header>
  )
}
