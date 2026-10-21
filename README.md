# Tappytoon Scraper — Web App for Android and Desktop

A functional, responsive web application for processing and downloading images from Tappytoon episodes that the user has legitimately purchased and can access.

---

## 1. Features Implemented

- **URL Input & Validation**: Paste Tappytoon episode URLs (`/en/comics/series-slug/1` or `/en/chapters/123`). Validates domain, structure, and canonical format with clear error feedback for invalid or series-level URLs.
- **Episode Preview**: Detects series title, episode title, language, thumbnail, access status, and image count before scraping.
- **Persistent IndexedDB Queue**: Adds episodes to a persistent queue. Retains queue items and downloaded image payloads across page refreshes.
- **Duplicate Prevention**: Rejects duplicate URL queue entries for the same episode.
- **State Management**: Handles job state transitions (`Waiting` -> `Processing` -> `Completed` / `Failed`), showing progress indicators, retry options for failed tasks, and queue deletion.
- **ZIP File Engine**: Packages extracted images into a ZIP file with zero-padded sequential filenames (`001.jpg`, `002.jpg`, `003.jpg`) and safe archive filenames.
- **Responsive Android & Desktop UI**: Clean, mobile-first design using Tailwind CSS that works seamlessly on narrow Android phone screens and desktop browsers without horizontal overflow.
- **Modular Adapter Architecture**: Decoupled `TappytoonAdapter` interface separating extraction/authentication mechanisms from UI logic.
- **Session & Security Compliance**: Respects Tappytoon access controls, DRM, and terms. Never requests, persist, or logs user passwords, cookies, or auth tokens.

---

## 2. Project File Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions Pages deployment workflow
├── src/
│   ├── components/
│   │   ├── Header.tsx              # Application header
│   │   ├── UrlInput.tsx            # Input field with Paste, Clear, Scrape buttons
│   │   ├── EpisodePreview.tsx      # Episode metadata card & access status
│   │   ├── QueueList.tsx           # Queue item cards with progress, retry, delete, ZIP download
│   │   ├── IntegrationInfo.tsx     # Explanatory card for DRM & CORS considerations
│   │   └── __tests__/
│   │       └── App.test.tsx        # UI interaction component tests
│   ├── services/
│   │   ├── tappytoonUrl.ts         # URL parser and canonical URL generator
│   │   ├── tappytoonAdapter.ts     # Tappytoon extraction adapter
│   │   ├── db.ts                   # IndexedDB persistent storage engine (`idb`)
│   │   ├── queueManager.ts         # Queue controller & status manager
│   │   ├── zipGenerator.ts         # JSZip engine with sequential 001.jpg filenames
│   │   └── __tests__/
│   │       ├── tappytoonUrl.test.ts
│   │       ├── queueManager.test.ts
│   │       └── zipGenerator.test.ts
│   ├── test/
│   │   └── setup.ts                # Vitest setup configuration
│   ├── App.tsx                     # Main application view
│   ├── index.css                   # Tailwind styles
│   └── main.tsx                    # React entrypoint
├── index.html                      # HTML template
├── package.json                    # Dependencies & scripts
├── tailwind.config.js              # Tailwind styling configuration
├── tsconfig.json                   # TypeScript configuration
└── vite.config.ts                  # Vite configuration (`base: './'` for Pages)
```

---

## 3. How to Run and Deploy

### Local Development
```bash
# Install dependencies
npm install

# Start local Vite development server
npm run dev
```

### Running Tests
```bash
# Run Vitest unit & component test suite
npm test
```

### Production Build
```bash
# Compile TypeScript and build production bundle
npm run build
```

### GitHub Pages Deployment
1. Push changes to `main` branch.
2. The GitHub Actions workflow `.github/workflows/deploy.yml` automatically runs tests, builds the application, and deploys the `dist/` directory to GitHub Pages.
3. Configure **Settings > Pages > Source** to `GitHub Actions` in the GitHub repository settings.

---

## 4. Tappytoon Integration Notes & Remaining Blockers

1. **Browser CORS Policies**: Standard web applications running purely client-side in the browser are restricted by Cross-Origin Resource Sharing (CORS) when attempting to fetch pages directly from `https://www.tappytoon.com`.
2. **Digital Rights Management (DRM)**: Tappytoon paid chapters use encrypted canvas/image rendering for DRM protection.
3. **Session Cookies**: Session cookies are scoped to `*.tappytoon.com` with `SameSite`/`HttpOnly` flags and cannot be read across origins by third-party web apps.
4. **Permitted Workarounds for Full Extraction**:
   - Running the web application inside an **Android Webview / APK Wrapper** with cross-origin access enabled and shared session cookies.
   - Using a dedicated CORS proxy server or browser extension permitted by the user's session.

---

## 5. Manual Testing Steps for Android Chrome

1. Open Android Chrome browser and navigate to the deployed web application URL.
2. Verify layout renders vertically without horizontal scrolling or clipping.
3. **Test URL Paste & Validation**:
   - Copy a Tappytoon link: `https://www.tappytoon.com/en/comics/solo-leveling/1`.
   - Tap the **Paste** button.
   - Verify the episode preview displays "Solo Leveling" and "Episode 1".
4. **Test Queue & Persistence**:
   - Tap **Scrape Episode**.
   - Verify the item is added to the **Download Queue** with `Waiting` / `Processing` status.
   - Refresh the page on Android Chrome.
   - Confirm the item remains present in the Queue with state restored from IndexedDB.
5. **Test Duplicate Prevention**:
   - Paste the exact same URL again and click **Scrape Episode**.
   - Verify error banner appears: *"This episode is already in the queue"*.
6. **Test Retry & Download**:
   - For completed queue items, tap **Download ZIP** and confirm Android downloads `<series>_<episode>.zip`.
   - Extract the ZIP on Android to verify filenames are zero-padded sequentially (`001.jpg`, `002.jpg`).
