# Deployment guide

## Recommended stack

- App hosting: Vercel
- Database + storage: Supabase
- WhatsApp provider: Meta WhatsApp Cloud API
- Search grounding: Tavily
- Model provider: OpenAI

## Required environment variables

Copy from `.env.example` and set at minimum:

- `APP_BASE_URL`
- `ADMIN_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `WHATSAPP_PROVIDER=meta`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_APP_SECRET`
- `AI_API_KEY`
- `SEARCH_API_KEY`
- `QUEUE_SECRET`
- `PROCESS_ASYNC=true` for background queue mode

## Supabase setup

1. Create a new Supabase project.
2. Create a private storage bucket named `plant-images` (or set `SUPABASE_STORAGE_BUCKET`).
3. Run `supabase/schema.sql` in the SQL editor.
4. Copy the project URL and service role key into your deployment env vars.

## Vercel deployment

1. Import the GitHub repo into Vercel.
2. Set all required environment variables.
3. Keep `PROCESS_ASYNC=true` in production.
4. Deploy.
5. Confirm these routes are live:
   - `/api/health`
   - `/api/webhooks/whatsapp`
   - `/admin/login`
6. Vercel cron will hit `/api/internal/queue/process` every 2 minutes via `vercel.json`.
7. Add `QUEUE_SECRET` to Vercel env and send it as `x-queue-secret` if you trigger the worker manually.

## Meta WhatsApp setup

1. In Meta for Developers, create or open your WhatsApp app.
2. Add your webhook URL:
   - `https://your-domain/api/webhooks/whatsapp`
3. Set the verify token to match `WHATSAPP_VERIFY_TOKEN`.
4. Subscribe to message events.
5. Add phone number credentials into env vars.
6. Send a real test image from an allowed WhatsApp number.

## Production checklist

- [ ] `npm run build` passes locally
- [ ] Supabase schema applied
- [ ] storage bucket exists and is private
- [ ] all required env vars set
- [ ] Meta webhook verification succeeds
- [ ] inbound media downloads correctly
- [ ] diagnosis job is persisted
- [ ] outbound WhatsApp reply is delivered
- [ ] admin login works
- [ ] signed image link opens
- [ ] queue processor handles pending jobs
- [ ] rate limiting returns 429 when spammed
- [ ] logs do not expose secrets

## Manual queue trigger

```bash
curl -X POST \
  -H "x-queue-secret: YOUR_QUEUE_SECRET" \
  https://your-domain/api/internal/queue/process
```

## Railway / Render notes

You can also deploy the app to Railway or Render using the included config files.

- Railway: uses `railway.json`
- Render: uses `render.yaml`

If you host outside Vercel, schedule a cron job that POSTs to:
- `/api/internal/queue/process`
with header:
- `x-queue-secret: <QUEUE_SECRET>`
