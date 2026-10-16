---

```markdown
# NomaanOS

> A personal notes operating system — encrypted, and entirely yours.

`NomaanOS` is a private workspace for thoughts, notes, and ideas. Everything is
stored locally in your browser. Nothing is uploaded, nothing is tracked, and
every note you mark as private is encrypted with AES-256 before it touches disk.

Built as a single-page React app with a clean OS-like interface, NomaanOS
combines the speed of a native app with the privacy of a paper journal.

---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [How Encryption Works](#how-encryption-works)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Deployment](#deployment)
- [License](#license)

---

## Features

### Core
- **Create, edit, and delete notes** with a rich-text editor (bold, italic, underline, lists)
- **Auto-save drafts** every 2 seconds — recover unsaved work after a crash or accidental close
- **Global search** across titles, body, tags, folders, and categories
- **Grid and list views** with manual sort, tag filter, and category filter
- **Duplicate notes** with a single click from the 3-dot menu

### Organization
- **Folders** with nested paths (`Work/Projects/Q1`)
- **Categories** for broad grouping
- **Tags** for cross-cutting labels
- **Favorites** and **Pinned** notes for quick access
- **Archive** and **Trash** with restore and permanent delete
- **Bulk actions** — select multiple notes and archive, tag, favorite, pin, or trash them at once

### Privacy & Security
- **End-to-end encryption** (AES-GCM 256) for notes marked as private
- **Password-protected notes** — no password, no access. Passwords never leave the device
- **PBKDF2 key derivation** with 150,000 iterations
- **Zero network calls** — nothing leaves your browser, ever

### Media & UX
- **Drag-and-drop reordering** with manual sort mode
- **Three themes** — Light, Dark, and Lavender (with CSS-variable theming for future themes)
- **Mobile-first navigation** with a slide-out drawer
- **Fully responsive** from 320px up

### System
- **Offline-first** — the entire app runs without a server
- **Trash auto-purge** — optionally empty trash after N days
- **Persistent storage** — everything saves to `localStorage` (metadata)

---

No backend. No database. No analytics. No external services.

---

## Getting Started

### Prerequisites
- Node.js 18 or newer
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/nomaanos.git
cd nomaanos

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app opens at `http://localhost:5173/`.

### Build for production

```bash
npm run build
npm run preview
```

### Project scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Build a production bundle into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run deploy` | Build and publish to GitHub Pages (if configured) |

---

## Project Structure

```
nomaanos/
├── public/                  # Static assets
├── src/
│   ├── components/          # React components
│   │   ├── Sidebar.jsx      # Left navigation
│   │   ├── Topbar.jsx       # Search, theme toggle, actions
│   │   ├── Dashboard.jsx    # Main note grid / list
│   │   ├── NoteCard.jsx     # Single note card
│   │   ├── NoteModal.jsx    # Note editor
│   │   ├── PasswordPrompt.jsx
│   │   ├── SettingsPanel.jsx
│   │   ├── FolderTree.jsx   # Nested folder tree
│   │   └── BulkActionsBar.jsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useDraftAutosave.js
│   │   ├── useImageStore.js
│   │   └── useImageUrl.js
│   ├── utils/               # Pure utilities
│   │   ├── crypto.js        # AES-GCM encryption helpers
│   │   └── idb.js           # IndexedDB wrapper
│   ├── App.jsx              # Root component + state
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles + theming
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| ⚛️ Framework | React 19 |
| ⚡ Build tool | Vite 8 |
| 🎨 Styling | Vanilla CSS + Tailwind v4 |
| 🖼️ Icons | Lucide React |
| 🎯 Drag & drop | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| 💾 Client storage | `localStorage` |
| 🔐 Cryptography | Web Crypto API (native) |
| ✍️ Fonts | DM Sans, Manrope |

---

## How Encryption Works

NomaanOS uses the browser's native **Web Crypto API** — no third-party crypto library is involved, and no key ever leaves the device.

1. **Locking a note.** When you mark a note as private and set a password, the app:
   - Derives a 256-bit key from your password using **PBKDF2** with a random 16-byte salt and 150,000 iterations
   - Encrypts the note's title, body, tags, and metadata as JSON using **AES-GCM**
   - Stores only the ciphertext, the salt, and the IV in `localStorage`
   - Wipes the plaintext from memory

2. **Unlocking a note.** When you enter the password, the app:
   - Re-derives the key from the same salt
   - Attempts AES-GCM decryption
   - If the password is wrong, the decryption fails silently — you see "Wrong password"

3. **No recovery.** Because the password is never stored anywhere, **there is no way to recover a locked note if you forget the password**. This is intentional and matches the security model of tools like 1Password and Standard Notes.

### What you'll see in `localStorage`

A locked note looks like this:

```json
{
  "id": "abc-123",
  "title": "🔒 Locked note",
  "body": "",
  "locked": true,
  "encrypted": {
    "cipher": "kR2x8n+9...",
    "salt": "5vQm3p...",
    "iv": "f8Lq1z...",
    "v": 1
  }
}
```

There is no readable plaintext anywhere.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘ K` / `Ctrl K` | Focus search |
| `Enter` on a note card | Open the note |
| `Esc` | Close the current modal |

---

## Deployment

### GitHub Pages

The recommended way to deploy NomaanOS is with `gh-pages`:

1. **Set the base path** in `vite.config.js`:

   ```js
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig(({ command }) => ({
     plugins: [react()],
     // Use the repo name only in production builds
     base: command === 'build' ? '/nomaanos/' : '/',
   }))
   ```

2. **Add scripts** to `package.json`:

   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. **Deploy:**

   ```bash
   npm run deploy
   ```

4. **Enable Pages** in your repository: **Settings → Pages → Source → Deploy from a branch → `gh-pages` / `root`**

Your app will be live at `https://<your-username>.github.io/nomaanos/`.

### Other hosts

NomaanOS is a static site. It works on Vercel, Netlify, Cloudflare Pages, and any static host. Just run `npm run build` and deploy the `dist/` folder.

---

## Privacy

NomaanOS makes **no network requests**. There is no telemetry, no analytics, no error reporting, and no third-party scripts beyond the Google Fonts stylesheet loaded at build time.

All data lives in your browser:
- `localStorage` — notes, settings, theme, drafts
- IndexedDB — image attachments

Clearing your browser data will delete your notes. Export regularly if you care about the data.

---

## License

MIT — do whatever you want. Attribution appreciated but not required.

---

## Credits

Built by **Nomaan** as a personal workspace and a demonstration that a
well-designed notes app doesn't need a server, an account, or a subscription
to be useful.

---

*"Your notes, your machine, your rules."*
```

---

## 📌 Notes on customization

Before you push this:

1. **Replace `<your-username>`** with your actual GitHub username (appears 2×).
2. **Change `nomaanos`** to your actual repo name if different (appears ~4×).
3. **Update the roadmap** — check off the features you've already shipped.
4. **Add a screenshot** at the top:
   ```markdown
   ![NomaanOS screenshot](./screenshot.png)
   ```
   Take a screenshot of the app, save it as `screenshot.png` in the project root, and it'll render on GitHub.
5. **Optionally add a banner** — a wide 1280×400 image with the logo and name. `banner.png` in root, reference at the top:
   ```markdown
   ![NomaanOS](./banner.png)
   ```

---

## 🎁 Bonus — add these two small files too

### `.gitignore` (if not already present)

```gitignore
node_modules
dist
dist-ssr
*.local
.DS_Store
.env
.env.local
.vercel
.netlify
```

### `LICENSE` (MIT)

```text
MIT License

Copyright (c) 2026 Nomaan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---
