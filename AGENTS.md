# Project Rules & Guidelines - JERIS

## 1. Preserve User Edits
- **Do Not Revert User Changes**: Never overwrite, delete, or revert modifications made directly by the user in the codebase without explicit user confirmation.
- **Inspect Before Modifying**: Always check `git diff` or recent changes before editing files to ensure any manual edits (e.g. variable simplifications, UI text changes, removed buttons) are strictly preserved.

## 2. Google Blogger Dashboard UI Guidelines
- **Layout Architecture**:
  - **Left Sidebar**: Blog selector dropdown, prominent pill CTA button `+ POSTINGAN BARU` (linking to `/editor`), and vertical navigation menu (`Postingan`, `Statistik`, `Komentar`, etc.).
  - **Header Search Bar**: Central rounded pill search bar with `"Telusuri postingan"` placeholder and info icon.
  - **Filter Subheader**: Dropdown filter on the left (`Semua (X) ▾`, `Dipublikasikan`, `Draf`) and action button `KELOLA` with label tag icon on the right.
  - **Post List Row Items**: Clean non-card row design featuring:
    - Square rounded thumbnail on the left.
    - Post title, publication status and date (`Draf • [Tanggal]` / `Dipublikasikan • [Tanggal]`), and rounded pill label tags.
    - Author info with avatar circle, accompanied by engagement indicators (share icon, comment count, view statistics).
    - Quick actions (Edit `/editor?id=...`, Preview, Delete) accessible cleanly on hover or touch.

## 3. Next.js Windows Build Stability
- On Windows operating systems, avoid enabling experimental multi-threaded parallel compilation flags (`webpackBuildWorker`, `parallelServerBuildTraces`, `parallelServerCompiles`) in `next.config.mjs` to prevent static page prerendering crashes (`TypeError: Cannot read properties of undefined (reading 'call')`).

