# Apex Gym — Production Architecture (Android & Web)

Modern fitness club application suite featuring a Member Mobile App (Android/PWA), Turnstile Gate Scanner, Operations Management Suite, and Supabase Backend.

---

## 1. Quick Start (Web & Preview Mode)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local dev server:**
   ```bash
   npm run dev
   ```
   * Open [http://localhost:5173](http://localhost:5173) in your browser.
   * **Desktop Browser:** Shows the interactive dual-view (switch between Member Mobile App, Operations Suite, or Side-by-Side).
   * **Member Mobile App only:** Open [http://localhost:5173/?app](http://localhost:5173/?app) or use browser mobile device inspection mode.

---

## 2. Connect to Supabase (Optional for Live Cloud Backend)

The app works out of the box in **offline/local demo mode** using local persistence (`@capacitor/preferences`). To connect your live Supabase cloud database:

1. **Create your environment file:**
   ```bash
   cp .env.example .env
   ```
2. **Add your Supabase credentials** in `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. **Run the Database Migrations:**
   In your Supabase project dashboard, open the **SQL Editor** and run:
   * `supabase/schema.sql` (Creates tables, RLS policies, and triggers)
   * `supabase/rpc.sql` (Creates atomic occupancy procedures)
   * `supabase/seed.sql` (Inserts initial classes and demo members)

---

## 3. Build & Run on Android

### Option A: Using Android Studio (Local Emulator or USB Device)

1. **Build web assets and sync to Android:**
   ```bash
   npm run android:sync
   ```
2. **Open the project in Android Studio:**
   ```bash
   npm run android:open
   ```
3. In Android Studio, select your connected device or emulator and click **Run (Green Play button)**.

### Option B: Build APK via Terminal (Without Opening Android Studio)

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```
The output APK will be generated at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Option C: Cloud CI/CD (GitHub Actions)

Push your changes to the `main` branch or trigger manually under **Actions > Build Android APK**. Download the compiled `apex-gym-debug-apk` directly from the workflow run's **Artifacts** section.

---

## 4. Test Accounts & Roles

On the login screen, click the **Quick Demo Accounts** buttons to test each role instantly:

| Role | Mobile | Demo OTP | Capabilities |
| :--- | :--- | :--- | :--- |
| **Member** | `98300 10001` | `1234` | Live dynamic QR gate pass, class booking, workout/PR logging, digital membership card |
| **Staff** | `98300 10002` | `1234` | Live camera QR scanner, turnstile verification, manual check-in, recent gate feed |
| **Manager** | `98300 10003` | `1234` | Operations dashboard, class scheduler, member directory, trial inquiries |
