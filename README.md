# Momentum Tracker — PWA + optional Firebase sync

## Test locally

In this folder run `python -m http.server 8000` and open http://localhost:8000. Data is stored in that browser. For mobile access and install, deploy to HTTPS hosting such as GitHub Pages.

## Install as an app

Upload the **contents** of this folder to GitHub Pages (or another HTTPS static host). On Android Chrome, use the browser menu **Install app / Add to Home screen**. On iOS Safari, use **Share → Add to Home Screen**. The browser may require visiting the site more than once before offering installation.

## Enable sync

1. Create a Firebase project on https://console.firebase.google.com/ (Spark plan).
2. Register a **Web app** under Project Settings, then copy its `firebaseConfig` object fields into `firebase-config.js`.
3. Open **Authentication → Sign-in method** and enable **Google**. Add your hosted domain to **Authorized domains** (Firebase Authentication settings). `localhost` is not automatically authorized for newer projects; add it explicitly if testing locally.
4. Create **Cloud Firestore** and paste contents of `firestore.rules` into its **Rules** tab. Publish the rules; do not use open/test-mode rules for real use.
5. Redeploy the folder. Sign in on each device with the same Google account.

The cloud document is private to its signed-in owner through Firestore security rules. The API key in frontend config is *not* a secret. Use a trustworthy device and host. Changes normally synchronize online; offline changes save in browser localStorage and upload when the app is online and open again.

**Important:** This initial sync uses a *single cloud document per user* (last write wins). Simultaneous edits from two devices can overwrite one another, and a one-time setup choice can replace existing data. Export JSON before enabling sync or switching devices. For robust concurrent/offline merging, a per-check-in document architecture would be the next improvement.

## Existing tracker data

The previous single HTML file and this hosted PWA use different browser storage origins, so data is **not** automatically carried across. Export **JSON** from the older tracker and **Import JSON** inside the hosted PWA **before** enabling cloud sync.

## Backups

JSON is the preferred full backup; CSV is available for analysis. Browser local storage is not contained inside HTML files or embedded into downloaded app files.
