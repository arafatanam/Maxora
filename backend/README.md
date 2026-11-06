# Maxora backend and web app

Next.js 14 app. It serves the web app at `/` and the API at `/api/*`. Data lives in Supabase. AI calls go through `lib/ai.js`, which tries the providers in `AI_VISION` and `AI_CHAT` in order (Groq, with Cloudflare Workers AI as an optional fallback). There are no accounts or payments.

| Step | Action |
| --- | --- |
| 1 | `npm install`, then copy `.env.example` to `.env.local` and fill it in |
| 2 | New Supabase project: run `supabase/schema.sql`. Existing one: run `supabase/migrations/2026-11-06-free-no-auth.sql` |
| 3 | `npm run dev` and open http://localhost:3000 |
| 4 | Deploy to Vercel and set the same variables there |

`MOCK_AI=true` returns fixed results without calling any AI provider.

## Identity and limits

Every request must send `x-device-id`, a random UUID v4 that the web app or phone app creates and keeps locally. Rate limits are per IP address and are listed in `LIMITS` in `lib/server.js`. IPs are hashed with `IP_HASH_SALT` before they are stored.

## Photo cleanup

Vercel Cron calls `GET /api/cron` daily (see `vercel.json`), and sends `Authorization: Bearer $CRON_SECRET` automatically. The job deletes photos 7 days after each scan, removes scans that were started but never analyzed, and clears expired rate-limit counters.

## API

| Route | Purpose |
| --- | --- |
| `GET me` | Profile, remaining limits, photo retention days |
| `POST profile` | Onboarding answers and consent |
| `POST settings` | Update gender, age range or goal |
| `POST scan/start` | Start a scan, returns `{ id }` |
| `POST scan/photo?id=&k=front\|side` | Raw image body, max 4 MB |
| `POST analyze` | `{ id }`. Runs the analysis |
| `GET scan[?id=]` | Latest or specific completed scan with plan |
| `GET scans` | History list |
| `POST plan/toggle` | `{ id, completed }` |
| `GET chat`, `POST coach` | Coach Maxy history and messages |
| `POST delete` | `{ mode: 'photos' \| 'all' }` |
