# Apex Gym app

React + Vite + Tailwind prototype, installable as a PWA and packaged as an Android APK with Capacitor.

## What you see
- **Laptop browser:** the dual-view prototype (phone frame, website, admin, side-by-side).
- **Phone, installed app, or any URL ending in `?app`:** only the member app, full screen. Admin is not reachable from the app.

## Run it
    npm install
    npm run dev        # http://localhost:5173  (add ?app to see the full-screen member app)
    npm run build      # production build into dist/

## Build the Android APK
Option A, no Android Studio: push to GitHub, open Actions, run "Build Android APK", download `apex-gym-debug-apk` from the run's Artifacts.

Option B, on your Mac (needs Android Studio):
    npm run build
    npx cap add android
    npx cap sync android
    npx cap open android
Then Build > Build Bundle(s) / APK(s) > Build APK(s). Output: `android/app/build/outputs/apk/debug/app-debug.apk`.

After changing code: `npm run build && npx cap sync android`, then rebuild.

## Install on a phone
Send the APK by WhatsApp, Drive or cable, open it, and allow installs from that source. This is a debug build for demos. A Play Store release needs a signed release build.
