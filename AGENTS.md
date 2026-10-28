# AGENTS.md

PTab: a Manifest V3 new-tab browser extension (Chrome / Edge / Firefox). React 19 + Vite 7, plain JS/JSX (no TypeScript), no framework beyond React, no router, no state library.

## Commands

```bash
npm install
npm run dev              # Vite dev server at http://localhost:5173 (plain web page only)
npm run lint             # eslint . -- the only quality gate; there are NO tests and NO typecheck
npm run build:chrome     # vite build -> output/chrome/ (npm run build is identical)
npm run build:firefox    # vite build --mode firefox -> output/firefox/
```

- Verify changes with `npm run lint` plus both builds. Nothing else exists.
- The dev server does not produce an extension. To exercise extension behavior, run a build and load the output folder:
  - Chrome/Edge: `chrome://extensions/` -> Developer mode -> Load unpacked -> `output/chrome/`
  - Firefox: `about:debugging#/runtime/this-firefox` -> Load Temporary Add-on -> `output/firefox/manifest.json` (temporary; expires on restart)
- After editing code, the loaded extension never hot-reloads: rebuild, then click the refresh icon on the extension page and reopen the tab.

## Releases (GitHub Actions)

- `.github/workflows/release.yml` triggers on `v*` tag pushes and manual dispatch: `npm ci` -> lint -> guard that the tag equals `public/manifest.json` `version` (e.g. `v0.0.2`) -> build both browsers -> zip `ptab-chrome.zip` / `ptab-firefox.zip` -> create the GitHub release with `gh`.
- The shipped extension version is `public/manifest.json` `version`; `package.json` version can drift from it — bump both before tagging or the release guard will fail.
- Manual dispatch only builds and uploads artifacts; it does not create a release.

## Build / manifest quirks

- `public/manifest.json` is copied as-is to both build outputs. Firefox-specific fields are injected by the inline `browser-manifest` plugin in `vite.config.js` (`closeBundle`), which rewrites `output/firefox/manifest.json` after the build:
  - `browser_specific_settings.gecko.id` = `hello@pg25-lsae.eu.org` (only lives in vite.config.js, not in public/manifest.json)
  - `chrome_settings_overrides.homepage` = `index.html`
  - Consequence: `output/*/manifest.json` is generated output — do not hand-edit it, and do not expect Firefox settings to appear from editing `public/manifest.json` alone.
- Output dirs are chosen by Vite `mode`: only `--mode firefox` writes `output/firefox/`; everything else writes `output/chrome/`. Both dirs can coexist (each build empties only its own dir).
- No background/service worker or content scripts; the extension only overrides `newtab` and requests the `storage` permission.

## Architecture

- Entry chain: `index.html` -> `src/main.jsx` -> `src/App.jsx` (owns all state) -> `src/components/` (`VideoBackground`, `Clock`, `SettingsPanel`). There is intentionally no greeting component.
- App state and persistence:
  - `settings` = `{ showClock, clockPos, overlayOpacity, accentColor }`, in `localStorage` under key `newtab_settings`, written by a `useEffect` in `App.jsx`; defaults in `DEFAULT_SETTINGS`. Missing keys fall back via `{ ...DEFAULT_SETTINGS, ...parsed }`, so new settings only need a default added there.
  - `clockPos` is a 9-grid position (`tl`/`tc`/`tr`/`ml`/`mc`/`mr`/`bl`/`bc`/`br`, default `mc`), applied as a `content pos-*` class; the settings picker's `.pos-cell` buttons reuse the same alignment classes.
  - `showClock` is a single switch: when false, `App` does not render `Clock`, which hides both the time and date lines and stops the 1s interval.
  - The uploaded background video lives in IndexedDB (`src/utils/db.js`): DB `ptab-videos`, store `videos`, single key `uploaded_video`. The `File`/`Blob` is stored directly — never convert it to an ArrayBuffer (reading a large video into main-thread memory causes visible jank; legacy `{ data: ArrayBuffer }` records are still read correctly). Uploaded through `SettingsPanel` (click or drag anywhere on the open settings page), never read from disk at build time.
- `App.jsx` builds the object URL with `useMemo` keyed on `uploadedVideo` and revokes it in an effect; creating the URL inline in render would change `<video src>` on every re-render and reload the video. Keep both the memo and the revoke pairing intact.
- No-video default background follows the browser theme via CSS system colors (`color-scheme: light dark`, `Canvas`); when no video is set, `.app.no-video` switches text/buttons to `CanvasText` so they stay readable on light themes. The dark overlay is only rendered when a video exists.
- The settings panel (`.settings-panel`) is height-capped at `min(640px, 86vh)`: header/footer are `flex-shrink: 0`, only `.settings-body` scrolls (`flex:1; min-height:0; overflow-y:auto`, thin scrollbar via `scrollbar-width`/`::-webkit-scrollbar`). Its background is the system color `Canvas` with `CanvasText`-derived `--sp-*` color-mix variables so it follows the browser theme — do not hardcode dark rgba colors inside the panel.
- Drag-and-drop handlers live on the full-screen `.settings-backdrop` (not the small upload zone), with a `dragCounter` ref to cancel child enter/leave events.
- Styling is all plain CSS: `src/App.css` (global, fonts, theme) + `src/index.css`. The accent color propagates as CSS variable `--accent` set on the root element; z-index ladder: backdrop 50, settings button 10, content 1, video 0.

## Lint specifics

- `eslint.config.js` ignores `dist`, `dist-firefox`, and `output` (legacy dirs may still exist on disk).
- `no-unused-vars` is configured with `varsIgnorePattern: '^[A-Z_]'`, so PascalCase components and CONSTANT names never flag as unused.
- The `react-hooks/set-state-in-effect` rule is active: `App.jsx` carries a disable for its async load effect, and `VideoBackground.jsx` resets its error state during render (the `prevSrc` pattern) instead of inside the effect. Do not move `setState` back into that effect body.

## Docs and repo gotchas

- `docs/.ai/{overview,architecture,components}.md` were reconciled with the current upload-based flow (2026-10-28); `CHANGELOG.md` records history, so older entries there may describe removed features.
- `docs/.ai/index.md` links to docs that do not exist (`styles.md`, `development.md`, `extension.md`, `api.md`, `contributing.md`); only `overview.md`, `architecture.md`, `components.md`, `CHANGELOG.md` are real.
- `.gitignore` has real entries (`output`, `dist`, `dist-firefox`, `dist.crx`, `dist.pem`) plus legacy ones (`*.mp4`, `src/video-list.generated.js`). Old `dist/` and `dist-firefox/` folders on disk are obsolete build output — builds now go to `output/`.
- `dist.pem` / `dist.crx` at the repo root are the extension signing key and package (git-ignored). Never commit or publish the `.pem`.

## Conventions from existing project docs (`docs/.ai/index.md`)

- No emoji anywhere in project documentation.
- After completing a change: remove any newly created redundant files/dirs, and record the change in `docs/.ai/CHANGELOG.md` (dated entries) plus the relevant `docs/.ai/*.md` file.
- Commit messages follow conventional prefixes (`feat:`, `fix:`, `docs:`).
