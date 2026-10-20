# Maxora

## Requirements

- Node.js
- Supabase project
- Groq API key
- Expo Go for mobile testing

## Backend setup

```powershell
cd backend
Copy-Item .env.example .env.local
npm install
```

Update `backend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
GROQ_MODEL=
MOCK_AI=false
TEST_MODE=true
```

Run the backend:

```powershell
cd backend
npm run dev -- --hostname 0.0.0.0
```

The backend runs at `http://localhost:3000`.

## Mobile setup

Copy the mobile environment file:

```powershell
cd mobile
Copy-Item .env.example .env
npm install
```

Update `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:3000
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Run the mobile app:

```powershell
cd mobile
npx expo start
```

Open the QR code in Expo Go on a device connected to the same network.

## Supabase

Run [`backend/supabase/schema.sql`](./backend/supabase/schema.sql) in the Supabase SQL editor and enable anonymous sign-ins under **Authentication → Providers**.
