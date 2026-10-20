# Facet AI backend

Next.js 14 API backed by Supabase, with Groq vision and chat analysis. The mock paywall is enabled by default.

## Setup
| Step | Action |
| --- | --- |
| 1 | `cp .env.example .env.local` and fill in values |
| 2 | Create a Supabase project. Run `supabase/schema.sql` in the SQL editor |
| 3 | Enable anonymous sign-ins in Supabase Authentication settings |
| 4 | Add `GROQ_API_KEY` and set `GROQ_MODEL` to a vision-capable Groq model |
| 5 | `npm install && npm run dev` |

## Payments
`TEST_MODE=true` grants a subscription with one tap. For real billing set `TEST_MODE=false`, add two Stripe prices (weekly, weekly with trial), and point a webhook at `/api/webhook` for `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`.

## Photo auto-delete
Call `GET /api/cron` daily with header `Authorization: Bearer $CRON_SECRET`. Vercel Cron works. Users with "keep photos" on are skipped.

## Before real users
- Replace the legal text in `app/page.js` with reviewed Terms, Privacy and Biometric notices.
- Test refusal rates on your model. The server retries once with a softer prompt.
- Add server-side face and minor checks if you need stricter gates. The prompt returns an error for no clear adult face.
