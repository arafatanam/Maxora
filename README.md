# Maxora

Maxora is a free facial self-improvement app for the web and for iOS and Android.
There is no sign-up: people open the app, confirm their age and consent, take a
front and a side photo, and get an AI facial analysis, an improvement plan,
scan history, and a coaching chat. It is for adults, and its scores are
estimates, not medical or objective judgments.

## Repository identity

- **GitHub repository:** `arafatanam/Maxora`
- **URL:** https://github.com/arafatanam/Maxora.git
- **Product name:** Maxora
- **Repository layout:** one Expo React Native app and one Next.js app that
  serves both the web app and the API

## Architecture

```text
Web app (backend/app/page.js)      Expo app (mobile/)
              \                      /
               \  HTTPS + x-device-id
                v                  v
        Next.js API (backend/app/api/[...path]/route.js)
                |
                +--> Supabase Postgres (scans, plans, chat, rate limits)
                +--> Supabase Storage (private photos, deleted after 7 days)
                +--> Groq vision and chat API (or mock mode)
```

- **No accounts.** Each browser or phone creates a random device ID, stores it
  locally, and sends it in the `x-device-id` header. All data belongs to that ID.
- **Free with fair-use limits per IP address.** Limits are counted in Postgres,
  and IP addresses are stored only as salted hashes:

  | Limit                     | Per IP, per day | Notes                                     |
  | ------------------------- | --------------- | ----------------------------------------- |
  | Completed scans           | 5               | A failed or rejected analysis does not count |
  | Analysis attempts         | 10              | Caps AI cost from repeated retries        |
  | Photo upload sessions     | 15              | Caps storage from abandoned uploads       |
  | Coach Vee messages        | 40              |                                           |
  | Any API request           | 120 per minute  | Burst protection                          |

  Change the numbers in `LIMITS` in [`backend/lib/server.js`](./backend/lib/server.js).
- **Photo retention.** A daily cron job (`/api/cron`, scheduled in
  `backend/vercel.json`) deletes photos 7 days after each scan, removes uploads
  that were never analyzed, and clears old rate-limit counters. Scores and plans
  are kept until the user deletes them in Settings.
- **Uploads.** Both apps resize photos to 1280px before upload. The server
  stores them in the private `photos` bucket, so neither app needs Supabase keys.

## Design

- Palette: dark `#2B1B5A`, light `#B9A7FF`, accent `#5EF2C2`. The accent is used
  only for primary actions, the active navigation item, and progress.
- Type: Sora for titles and headings, Inter for body text.
- Icon: [`mobile/assets/icon.svg`](./mobile/assets/icon.svg) is the source. The
  PNG app icon, Android adaptive icon, splash image, favicons and web manifest
  icons are rendered from it.
- The web app uses a sidebar from 960px up and a bottom tab bar below that. It
  works down to 320px wide and respects `prefers-reduced-motion`.

## File structure

Generated folders are not shown (`node_modules`, `.next`, `.expo`, `mobile/dist`).

```text
Maxora/
├── README.md
├── PRODUCTION.md                     # Deployment guide
├── backend/                          # Next.js 14: web app + API
│   ├── .env.example
│   ├── vercel.json                   # Daily cleanup cron
│   ├── app/
│   │   ├── page.js                   # Web app shell, navigation and hash routing
│   │   ├── layout.js                 # Fonts (Sora, Inter) and metadata
│   │   ├── globals.css               # Design tokens and all web styles
│   │   ├── icon.svg, apple-icon.png  # Favicons
│   │   ├── manifest.js               # Web app manifest
│   │   ├── legal/[doc]/page.js       # Terms, privacy, biometric notice
│   │   └── api/[...path]/route.js    # All API routes
│   ├── components/                   # Web screens and shared UI
│   ├── lib/
│   │   ├── client.js                 # Browser helpers: device ID, API, image resizing
│   │   ├── server.js                 # Supabase admin client, device ID, IP rate limits
│   │   └── prompts.js                # Analysis and coach prompts, scoring
│   ├── public/                       # Manifest icons
│   └── supabase/
│       ├── schema.sql                # Fresh install
│       └── migrations/               # Upgrades for existing databases
└── mobile/                           # Expo React Native app
    ├── app.json                      # Identity, icon, splash, permissions
    ├── App.js                        # Navigation shell, tab bar, splash handling
    ├── assets/                       # icon.svg (source) and rendered PNGs
    └── src/
        ├── api.js                    # Device ID, API, image resizing, uploads
        ├── icons.js                  # Lucide icons, imported one by one
        ├── ui.js                     # Theme, components, legal copy
        └── screens/                  # Onboard, Home, Scan, Results, Plan, Coach, History, Settings
```

## Backend and web app setup

```powershell
cd backend
Copy-Item .env.example .env.local
npm install
```

Set these values in `backend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
GROQ_MODEL=
MOCK_AI=false
CRON_SECRET=
IP_HASH_SALT=
```

Start it on all network interfaces so a phone on the same Wi-Fi can reach it:

```powershell
cd backend
npm run dev -- --hostname 0.0.0.0
```

Open http://localhost:3000 for the web app.

## Mobile setup

```powershell
cd mobile
Copy-Item .env.example .env
npm install
```

Set `EXPO_PUBLIC_API_URL` to your computer's LAN IP when testing on a phone:

```env
EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:3000
```

All native modules the app uses are included in Expo Go.

```powershell
cd mobile
npx expo start
```

## Supabase setup

- **New project:** run [`backend/supabase/schema.sql`](./backend/supabase/schema.sql)
  in the SQL editor.
- **Existing project from an earlier version:** run
  [`backend/supabase/migrations/2026-11-06-free-no-auth.sql`](./backend/supabase/migrations/2026-11-06-free-no-auth.sql)
  once. It renames `user_email` to `device_id`, drops subscriptions, and adds
  the rate-limit table and function.
- Anonymous sign-ins are no longer used. You can turn them off under
  **Authentication → Providers**.

## Main flows

1. First visit: answer gender, age range and goal, and confirm age and consent.
2. Add front and side photos. They are resized on the device and uploaded to the API.
3. The API runs the analysis. Only a successful analysis counts toward the daily scan limit.
4. View score, feature scores, strengths, face profile and the ranked plan.
5. Tick off plan items, compare scans in History, and chat with Coach Vee.
6. Settings: edit profile answers, delete photos now, or delete all data
   (this also resets the device ID).

## Safety and production notes

- Facial ratings are estimates for self-improvement; they are not medical,
  professional, or objective judgments.
- Replace the placeholder legal copy before release.
- Keep the service-role key, Groq key, cron secret and IP hash salt only in
  backend environment variables.
