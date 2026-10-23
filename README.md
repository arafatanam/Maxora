# Maxora

Maxora is a mobile-first facial self-improvement experience. Users create an
anonymous account, provide consent and profile details, capture front and side
photos, and receive an AI-generated facial analysis, improvement plan, history,
and coaching chat. The app is intended for adults and its scores are estimates,
not medical or objective judgments.

## Repository identity

- **GitHub repository:** `arafatanam/Maxora`
- **URL:** https://github.com/arafatanam/Maxora.git
- **Product name:** Maxora
- **Repository layout:** one Expo React Native client and one Next.js API/backend
- **Primary branch:** check the repository's current default branch on GitHub

## Architecture

```text
Expo React Native app (mobile/)
        |
        | HTTP requests + Supabase client auth/storage
        v
Next.js API (backend/app/api/[...path]/route.js)
        |
        +--> Supabase Auth, Postgres tables, and private photo storage
        +--> Groq vision/chat API (or deterministic mock mode)
        +--> Stripe subscription checks
```

The mobile app talks to the backend using `EXPO_PUBLIC_API_URL`. The backend
owns privileged Supabase access, AI calls, scan limits, subscription checks,
and persistence. Anonymous Supabase sign-in is used for the initial user flow.

## Complete tracked file structure

Generated dependencies and build output are intentionally excluded from this
tree (`node_modules`, `.next`, `.expo`, and `mobile/dist`).

```text
Maxora/
├── README.md                         # Project overview and setup guide
├── .gitignore                        # Repository-level ignore rules
├── backend/                          # Next.js 14 backend and web/legal surface
│   ├── .env.example                  # Backend environment variable template
│   ├── .gitignore
│   ├── README.md                     # Backend-specific notes
│   ├── package.json                  # Backend scripts and dependencies
│   ├── package-lock.json
│   ├── jsconfig.json                 # JavaScript path alias configuration
│   ├── next.config.js
│   ├── vercel.json                   # Vercel deployment configuration
│   ├── app/
│   │   ├── globals.css               # Web/legal page styles
│   │   ├── layout.js                 # Next metadata and root layout
│   │   ├── page.js                   # Legal/consent web page
│   │   ├── legal/[doc]/page.js       # Dynamic legal document page
│   │   └── api/[...path]/route.js    # Consolidated API route handler
│   ├── lib/
│   │   ├── prompts.js                # Analysis and coach prompts/scoring rules
│   │   └── server.js                 # Supabase server client and auth helpers
│   └── supabase/
│       └── schema.sql                # Tables, storage, and database policies
└── mobile/                           # Expo React Native client
    ├── .env.example                  # Mobile environment variable template
    ├── .gitignore
    ├── LICENSE
    ├── package.json                  # Expo scripts and dependencies
    ├── package-lock.json
    ├── app.json                      # Expo identity, permissions, and branding
    ├── eas.json                      # EAS build configuration
    ├── index.js                      # Expo entry point
    ├── App.js                        # Session bootstrap and screen navigation
    ├── assets/
    │   └── icon.png                  # Canonical app icon, adaptive icon, splash, and favicon
    └── src/
        ├── api.js                    # Authenticated backend request helper
        ├── purchases.js              # RevenueCat purchase initialization
        ├── ui.js                     # Shared UI primitives, theme, and legal copy
        └── screens/
            ├── Auth.js                # Sign-in/welcome screen
            ├── Onboard.js             # Age, consent, and profile onboarding
            ├── Scan.js                # Photo capture/picker and analysis state
            ├── Results.js             # Scan score and AI result display
            ├── Plan.js                # Improvement plan and completion state
            ├── Coach.js               # AI coaching chat
            ├── History.js             # Previous scans and progress
            ├── Paywall.js             # Subscription/test-mode paywall
            └── Settings.js            # Profile, account, and data actions
```

## Prerequisites

- Node.js 18 or newer
- A Supabase project
- A Groq API key and a vision-capable Groq model
- Expo Go for device testing, or an Android/iOS simulator
- Stripe and RevenueCat configuration for production billing

## Backend setup

```powershell
cd backend
Copy-Item .env.example .env.local
npm install
```

Set these values in `backend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
GROQ_MODEL=
MOCK_AI=false
TEST_MODE=true
```

Start the backend on all local network interfaces so a physical device can
reach it:

```powershell
cd backend
npm run dev -- --hostname 0.0.0.0
```

The backend is available at `http://localhost:3000` on the development
computer.

## Mobile setup

```powershell
cd mobile
Copy-Item .env.example .env
npm install
```

Set `EXPO_PUBLIC_API_URL` to the development computer's LAN IP when testing
on a physical device:

```env
EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:3000
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Start Expo:

```powershell
cd mobile
npx expo start
```

Scan the QR code in Expo Go on a device connected to the same network. The
canonical branding asset is [`mobile/assets/icon.png`](./mobile/assets/icon.png);
[`mobile/app.json`](./mobile/app.json) uses it for the app icon, Android
adaptive foreground, splash image, and web favicon.

## Supabase setup

1. Create a Supabase project.
2. Run [`backend/supabase/schema.sql`](./backend/supabase/schema.sql) in the
   Supabase SQL editor.
3. Enable anonymous sign-ins under **Authentication → Providers**.
4. Confirm the `photos` storage bucket and database policies were created.

## Main product flows

1. Start an anonymous guest session.
2. Complete age confirmation, consent, and profile onboarding.
3. Capture or select front and side photos.
4. Store photos privately and request the backend analysis.
5. Display the score, face profile, strengths, weaknesses, and improvement plan.
6. Track plan completion, view scan history, and chat with Coach Vee.
7. Enforce scan limits and subscription access through the backend.

## Safety and production notes

- Facial ratings are estimates for self-improvement and entertainment; they
  are not medical, professional, or objective judgments.
- Review and replace the legal copy before production release.
- Keep service-role, Groq, Stripe, and other private keys only in backend
  environment variables.
- Set `MOCK_AI=false` and configure a vision-capable `GROQ_MODEL` for real AI
  results.
- Set `TEST_MODE=false` only after real Stripe prices/webhooks and RevenueCat
  entitlements have been configured.
