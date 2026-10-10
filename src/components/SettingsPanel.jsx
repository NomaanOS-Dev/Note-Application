
import { Sun, Moon, Palette, Database } from 'lucide-react'

const themes = [
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark', Icon: Moon },
  { id: 'lavender', label: 'Lavender', Icon: Palette },
]

export default function SettingsPanel({ theme, setTheme, notes = [] }) {
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
          <Database size={18} /> Your workspace
        </h2>
        <p className="text-sm text-gray-500">
          Total notes: {notes.length}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Archived: {notes.filter(n => n.archived && !n.trashed).length}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          In trash: {notes.filter(n => n.trashed).length}
        </p>
        <p className="mt-4 text-xs text-gray-400">
          Your notes are stored locally in this browser.
        </p>
      </section>
    </section>
  )
}
