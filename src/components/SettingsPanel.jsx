import { Sun, Moon, Palette, Database, Trash2 } from 'lucide-react'

const themes = [
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark', Icon: Moon },
  { id: 'lavender', label: 'Lavender', Icon: Palette },
]

export default function SettingsPanel({
  theme, setTheme, notes = [], settings = {}, setSettings = () => {},
  onEmptyTrash = () => {},
}) {
  const trashed = notes.filter(n => n.trashed)

  return (
    <section className="mx-auto max-w-3xl space-y-8 p-6 md:p-10">
      <div>
        <p className="text-xs uppercase tracking-widest text-violet-500">
          Personalize your workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-sm text-gray-500">
          Make NoteNest feel like your own space.
        </p>
      </div>

      <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Palette size={18} /> Appearance
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {themes.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              aria-pressed={theme === id}
              className={`flex items-center gap-3 rounded-xl border p-4 transition ${
                theme === id
                  ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-200'
                  : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Trash2 size={18} /> Trash
        </h2>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoPurge ?? true}
            onChange={e => setSettings(s => ({ ...s, autoPurge: e.target.checked }))}
          />
          <span className="text-sm">
            Automatically empty Trash after{' '}
            <input
              type="number"
              min={1}
              max={365}
              value={settings.autoPurgeDays ?? 30}
              onChange={e => setSettings(s => ({ ...s, autoPurgeDays: Number(e.target.value) || 30 }))}
              style={{ width: 60, padding: '2px 6px', marginLeft: 4, marginRight: 4 }}
            />
            days
          </span>
        </label>

        <div className="mt-4 flex items-center gap-3">
          <p className="text-sm text-gray-500">
            {trashed.length} note{trashed.length === 1 ? '' : 's'} in Trash
          </p>
          {trashed.length > 0 && (
            <button className="secondary-button danger-outline" onClick={onEmptyTrash}>
              Empty Trash now
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Database size={18} /> Your workspace
        </h2>
        <p className="text-sm text-gray-500">Total notes: {notes.length}</p>
        <p className="mt-2 text-sm text-gray-500">
          Archived: {notes.filter(n => n.archived && !n.trashed).length}
        </p>
        <p className="mt-2 text-sm text-gray-500">In trash: {trashed.length}</p>
        <p className="mt-4 text-xs text-gray-400">
          Your notes are stored locally in this browser.
        </p>
      </section>
    </section>
  )
}