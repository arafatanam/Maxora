# Facet AI

## Stack

- **Mobile:** React Native 0.86, Expo SDK 57, and React 19; built for iOS and Android.
- **Backend:** Next.js 14 API routes and React 18.
- **Data and authentication:** Supabase Auth, Postgres, and private Storage. The app creates a persisted anonymous guest session; no email or password is required.
- **AI:** Groq chat completions for vision-based face analysis and Coach Vee. Configure a vision-capable model with `GROQ_MODEL`.
- **Payments:** RevenueCat in the mobile app, with Stripe webhook/checkout support in the backend.

## Functionality

- Capture or choose front and side-profile photos and request a face analysis.
- Review a free scan's overall estimate. Paid reports include feature scores, a face profile, strengths, weaknesses, and a ranked improvement plan.
- Paid tools include scan history, plan-progress tracking, and appearance-coaching chat.
- Manage privacy preferences, delete photos/account data, and view legal pages.
- Browse the app as a guest without signing in or creating an account. Existing free-tier scan limits and paid-feature restrictions still apply.
- Uses AI-generated appearance estimates, not medical advice. The app requires age confirmation and consent before a scan.

## How to use it

### 1. Configure Supabase

Create a Supabase project and run [`backend/supabase/schema.sql`](./backend/supabase/schema.sql) in its SQL editor. In **Authentication → Providers**, enable anonymous sign-ins. Add the project URL, anon key, and service-role key to `backend/.env.local` (start from `backend/.env.example`).

### 2. Configure the backend and Groq

From PowerShell:

```powershell
Set-Location backend
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm install
npm run dev
```

In `backend/.env.local`, set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Set `GROQ_API_KEY` and `GROQ_MODEL` to your Groq API key and a vision-capable model. Set `MOCK_AI=true` only when you want mock analysis; use `MOCK_AI=false` for Groq. Keep `TEST_MODE=true` for local testing.

### 3. Configure and run the mobile app

Find your computer's local IPv4 address with `ipconfig`. In a second PowerShell window:

```powershell
Set-Location mobile
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm install
```

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `mobile/.env`. Set `EXPO_PUBLIC_API_URL` to `http://YOUR_PC_IP:3000`, then start Expo:

```powershell
npx expo start
```

Open the QR code with Expo Go on a phone connected to the same Wi-Fi network. For a deployed backend, set `EXPO_PUBLIC_API_URL` to its HTTPS URL instead.

### 4. Build and release

See [`mobile/eas.json`](./mobile/eas.json) for build profiles. Install and sign in to EAS CLI, then use `eas build --platform android --profile preview` for an Android test build or `eas build --platform all --profile production` for production builds. Update the app identifier in [`mobile/app.json`](./mobile/app.json) before publishing.

For production purchases, set `TEST_MODE=false`, configure RevenueCat keys in `mobile/.env`, and set up the backend webhook. Native purchase flows require a development or production build; they are not available in Expo Go.
