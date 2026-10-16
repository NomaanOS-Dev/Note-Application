# NomaanOS

> A personal notes operating system — encrypted, private, and entirely yours.

NomaanOS is a private workspace for thoughts, notes, and ideas. It combines a clean, OS-inspired interface with local-first storage and privacy-focused features.

Create notes, organize them into folders, search across your workspace, and protect sensitive notes with password-based encryption.

**No account. No backend. No subscription required. Your notes stay on your device.**

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [How Encryption Works](#how-encryption-works)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Privacy and Data Storage](#privacy-and-data-storage)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Notes Management

- Create, edit, and delete notes.
- Write and format content with a rich-text editor.
- Automatically save drafts.
- Search notes by title, content, tags, folders, and categories.
- Switch between grid and list views.
- Duplicate existing notes.
- Sort notes manually or by supported sorting options.

### Organization

- Organize notes into folders and nested folders.
- Add categories for broad grouping.
- Use tags to categorize related notes.
- Pin important notes for quick access.
- Mark notes as favorites.
- Archive notes without permanently deleting them.
- Restore deleted notes from the trash.
- Perform bulk actions on multiple notes.

### Privacy and Security

- Password-protected private notes.
- AES-GCM 256-bit encryption for protected note content.
- PBKDF2-based password key derivation.
- Random salts and initialization vectors for encryption.
- Local processing using the browser's Web Crypto API.
- No account registration required.
- No application backend required.

**Security note:** These security properties depend on the implementation. Do not claim that every note is encrypted or that the application makes zero network requests unless you have verified those behaviors in the actual source code.

### User Experience

- Clean, desktop-inspired interface.
- Light, dark, and lavender themes.
- Responsive layouts for mobile, tablet, and desktop.
- Slide-out mobile navigation.
- Drag-and-drop note reordering, if enabled.
- Keyboard shortcuts for common actions.
- Persistent user preferences.

### Offline-First Architecture

- Store notes locally in the browser.
- Use IndexedDB for supported binary data and attachments.
- Work without a dedicated application server after the app has loaded.
- Keep application data under the user's control.

Browser storage is not a substitute for backups. Clearing browser data or losing access to a device can result in permanent data loss.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| Vite | Development server and production builds |
| JavaScript | Application logic |
| CSS | Styling, themes, and responsive layouts |
| Lucide React | Icons |
| Web Crypto API | Cryptographic operations |
| localStorage | Small persistent settings and data |
| IndexedDB | Larger local data and attachments |
| HTML5 Drag and Drop or dnd-kit | Note reordering, if configured |

Use the versions and dependencies declared in `package.json` as the source of truth for the actual project.

---

## Getting Started

### Prerequisites

Install the following:

- Node.js 18 or newer, subject to your installed Vite version's requirements.
- npm or pnpm.
- Git.
- A modern browser with Web Crypto API support.

### 1. Clone the repository

Replace `YOUR_USERNAME` with your GitHub username.

```bash
git clone https://github.com/YOUR_USERNAME/nomaanos.git
cd nomaanos
```

### 2. Install dependencies

Using npm:

```bash
npm install
```

Or using pnpm:

```bash
pnpm install
```

### 3. Start the development server

```bash
npm run dev
```

Open the local URL displayed in your terminal. For a standard Vite configuration, this is usually:

http://localhost:5173/

### 4. Build for production

```bash
npm run build
```

Vite normally outputs the production build into the `dist/` directory.

### 5. Preview the production build

```bash
npm run preview
```

### Available Scripts

The exact scripts depend on your `package.json`.

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run linting, if configured |
| `npm run deploy` | Deploy, if a deployment script is configured |

---

## Project Structure

The following is a suggested structure. Your actual files may differ.

```text
nomaanos/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── Topbar.jsx
│   │   ├── Dashboard.jsx
│   │   ├── NoteCard.jsx
│   │   ├── NoteModal.jsx
│   │   ├── PasswordPrompt.jsx
│   │   ├── SettingsPanel.jsx
│   │   ├── FolderTree.jsx
│   │   └── BulkActionsBar.jsx
│   ├── hooks/
│   │   ├── useDraftAutosave.js
│   │   ├── useImageStore.js
│   │   └── useImageUrl.js
│   ├── utils/
│   │   ├── crypto.js
│   │   └── idb.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
├── LICENSE
└── README.md
```

Only include files that actually exist in your repository.

---

## How Encryption Works

NomaanOS can use the browser's native Web Crypto API to protect private notes without sending passwords to a server.

A typical implementation follows these steps.

### 1. Derive an encryption key

The application generates a random salt and derives a key from the user's password using PBKDF2 and a suitable hash function such as SHA-256.

The iteration count should be chosen according to current security guidance and tested on supported devices. The value `150,000` is an implementation setting, not a universal security guarantee.

### 2. Encrypt the note

The application serializes the protected note content and encrypts it using AES-GCM with a 256-bit key and a unique, randomly generated initialization vector (IV).

AES-GCM provides confidentiality and authentication when used correctly.

### 3. Store the encrypted data

A protected note should persist only its ciphertext, salt, IV, and the metadata necessary to identify and decrypt it.

Any titles, tags, previews, or other metadata that must remain private should also be encrypted.

### 4. Unlock the note

When the user enters the password, the application derives the key again and attempts to decrypt the stored ciphertext.

If the password is incorrect or the ciphertext has been modified, authenticated decryption fails.

### 5. Password recovery

If the encryption key can only be derived from the user's password and no recovery mechanism exists, forgetting the password may make the encrypted content permanently inaccessible.

Users should understand this limitation before protecting important notes.

### Important Security Considerations

- Never store the plaintext password.
- Never reuse an AES-GCM IV with the same key.
- Use cryptographically secure random values.
- Avoid logging plaintext notes, passwords, or derived keys.
- Clear sensitive UI state when a note is locked.
- Remember that JavaScript cannot guarantee secure memory wiping in a browser.
- Consider encrypting backups and exports.
- Use a secure origin, such as HTTPS, for deployed applications.
- Audit dependencies and external scripts before making privacy claims.

**Encryption is only as strong as its implementation.** Review and test `src/utils/crypto.js` before describing NomaanOS as fully end-to-end encrypted.

---

## Privacy and Data Storage

NomaanOS is designed around local-first storage.

### Storage Locations

| Storage | Intended use |
|---|---|
| `localStorage` | Small settings and application state |
| IndexedDB | Larger datasets, images, and attachments |
| Browser memory | Temporary editing state and decrypted content |

The exact storage model depends on your implementation.

### What Users Should Know

- Data stored in a browser profile may be accessible to anyone with access to that profile.
- Browser extensions and malicious scripts can compromise locally available information.
- Local browser storage may be cleared by the user, browser, or operating system.
- Private browsing sessions may not retain data after the session ends.
- A static frontend can still make network requests through external scripts, fonts, analytics, or other resources.

For a verified zero-network implementation, audit network requests in the browser's developer tools and remove unnecessary third-party dependencies.

### Backups

Export or back up important notes regularly.

If exports contain private content, consider encrypting the exported file. Keep encryption keys and recovery information separate from encrypted backups.

---

## Keyboard Shortcuts

The following shortcuts are suggested defaults. Ensure they are implemented in your application before advertising them as supported.

| Shortcut | Action |
|---|---|
| `Ctrl + K` / `Cmd + K` | Focus search |
| `Enter` on a focused note | Open the note |
| `Esc` | Close the active modal |
| `Ctrl + S` / `Cmd + S` | Save the current note, if implemented |

Avoid intercepting browser shortcuts unless the application has a clear reason to do so.

---

## Deployment

NomaanOS is suitable for static hosting if it does not depend on server-side functionality.

### Option 1: Deploy to Vercel

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Select Vite as the framework if prompted.
4. Set the build command to `npm run build`.
5. Set the output directory to `dist`.
6. Deploy the application.

### Option 2: Deploy to Netlify

1. Push the project to GitHub.
2. Import the repository into Netlify.
3. Set the build command to `npm run build`.
4. Set the publish directory to `dist`.
5. Deploy the site.

### Option 3: Deploy to GitHub Pages

GitHub Pages can host the application as a static website.

#### Step 1: Configure the Vite base path

For a repository named `nomaanos`, configure `vite.config.js` as follows:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/nomaanos/',
})
```

If you are deploying to a custom domain or the root of a GitHub Pages site, the base path may need to be `/` instead.

#### Step 2: Install the deployment dependency

```bash
npm install --save-dev gh-pages
```

#### Step 3: Add deployment scripts

Merge these scripts into the existing `scripts` object in `package.json`:

```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

Do not replace other required scripts in your project.

#### Step 4: Deploy

```bash
npm run deploy
```

#### Step 5: Enable GitHub Pages

In your repository:

1. Open **Settings**.
2. Select **Pages**.
3. Configure the publishing source to use the `gh-pages` branch and its root directory, if that matches your deployment configuration.

Replace the username and repository name with your actual values.

---

## Roadmap

The following is a suggested roadmap, not a claim that every feature has been implemented.

- [ ] Complete note creation, editing, and deletion.
- [ ] Improve rich-text editing.
- [ ] Add nested folders and tags.
- [ ] Implement global search.
- [ ] Add favorites, pinning, archive, and trash.
- [ ] Implement reliable draft recovery.
- [ ] Add private-note encryption and security tests.
- [ ] Implement import and export.
- [ ] Add encrypted backups.
- [ ] Improve accessibility and keyboard navigation.
- [ ] Test offline behavior.
- [ ] Add automated tests.
- [ ] Optimize performance on mobile devices.

---

## Contributing

Contributions, bug reports, and feature suggestions are welcome.

### How to Contribute

1. Fork the repository.
2. Create a feature branch.

   ```bash
   git checkout -b feature/your-feature
   ```

3. Make your changes.
4. Test the application.

   ```bash
   npm run build
   ```

5. Commit your changes.

   ```bash
   git add .
   git commit -m "Add your feature"
   ```

6. Push your branch.

   ```bash
   git push origin feature/your-feature
   ```

7. Open a pull request describing your changes.

Please avoid committing passwords, private notes, API keys, environment files, or personal data.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Author

**Nomaan**

GitHub: [NomaanOS-Dev](https://github.com/NomaanOS-Dev)

---

## Acknowledgments

- React for the component-based user interface.
- Vite for fast development and production builds.
- Lucide for icons.
- The Web Crypto API for browser-native cryptographic functionality.
- The open-source community for tools and inspiration.

---

*Your notes. Your machine. Your rules.*
