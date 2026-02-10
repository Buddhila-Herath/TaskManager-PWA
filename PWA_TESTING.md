# PWA Installability – Check & Test Guide

This app is set up as a **Progressive Web App (PWA)** so it can be **installed** on devices. Use this guide to verify and test installability.

---

## 1. What Makes the App Installable

Your app meets installability when:

- **Served over HTTPS** (or `localhost` for testing)
- **Valid `manifest.json`** with:
  - `name` or `short_name`
  - `start_url`
  - `display`: e.g. `standalone` or `fullscreen`
  - **Icons**: at least one **192×192** and one **512×512** (PNG)
- **Registered service worker** (handles offline/caching)
- **Manifest linked** in the page (via Next.js metadata in `app/layout.tsx`)

All of the above are configured in this project.

---

## 2. Build for Production (Required for Full PWA)

PWA features are **disabled in development** (`next-pwa` in `next.config.mjs`). To test installability and the install prompt:

1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Run the production server:**
   ```bash
   npm run start
   ```

3. Open **http://localhost:3000** (or your production URL). Use this URL for the steps below.

---

## 3. Test Installability in Chrome (Desktop)

1. Open the app in **Chrome** (e.g. `http://localhost:3000` after `npm run start`).
2. Open **DevTools** (F12) → **Application** tab.
3. In the left sidebar:
   - **Manifest**: Check that manifest is loaded, no errors, and icons show.
   - **Service Workers**: You should see a registered service worker (e.g. from `next-pwa` or `/sw.js`).
4. In the address bar you should see an **install icon** (⊕ or “Install”).
5. Click it and confirm the app installs and opens in its own window.

If the install icon does not appear, check **Application → Manifest** for missing fields or broken icon URLs.

---

## 4. Test Installability on Android (Chrome)

1. Serve the app over **HTTPS** (or use Chrome’s “Port forwarding” from desktop to device).
2. Open the app URL in **Chrome** on the Android device.
3. Use Chrome’s menu (⋮) → **“Install app”** or **“Add to Home screen”**.
4. Confirm the app is added and opens in standalone (or fullscreen) mode.

---

## 5. Test with Lighthouse (PWA Audit)

1. Open the app in Chrome (production build: `npm run start`).
2. Open **DevTools** → **Lighthouse** tab.
3. Select **“Progressive Web App”** (and optionally “Performance”).
4. Choose **Desktop** or **Mobile** and run the audit.
5. Check that:
   - **“Installable”** (or equivalent) passes.
   - **“Registers a service worker”** passes.
   - **“Has a web app manifest”** passes and manifest has required fields and icons.

Fix any reported issues (e.g. missing manifest fields or icon sizes).

---

## 6. Quick Checklist

| Requirement              | Where to check                          |
|--------------------------|-----------------------------------------|
| HTTPS or localhost       | URL bar                                 |
| Manifest linked          | `app/layout.tsx` (metadata.manifest)    |
| Manifest valid + icons   | `public/manifest.json`, Application tab |
| Service worker registered| DevTools → Application → Service Workers|
| Install prompt / icon    | Chrome address bar or menu              |
| Lighthouse PWA score     | DevTools → Lighthouse → PWA             |

---

## 7. Troubleshooting

- **No install button**: Ensure you use a **production** build (`npm run build` then `npm run start`). Clear site data and reload.
- **Manifest errors**: Check `public/manifest.json` and that `icon-192x192.png` and `icon-512x512.png` exist in `public/`.
- **Service worker not registering**: Confirm `next-pwa` is not disabled; in production it should register automatically. Check **Application → Service Workers** for errors.

Once the checklist passes and Lighthouse PWA audit is green, the app is installable as a PWA.
