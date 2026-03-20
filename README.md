# Plant Health Assistant

Production-oriented WhatsApp-first AI plant health assistant built with Next.js, TypeScript, PostgreSQL/Supabase, and a modular diagnosis pipeline.

## What it does

- Accepts inbound WhatsApp image webhooks
- Downloads and stores inbound media
- Runs structured plant-analysis and diagnosis flow
- Validates likely issues against trusted source classes before replying
- Returns a WhatsApp-friendly diagnosis with a 1-10 confidence score
- Stores users, conversations, messages, diagnoses, validations, and follow-up history
- Provides an admin review dashboard with login, case detail, notes, and overrides

## Architecture

```text
WhatsApp (Meta or Twilio)
  -> /api/webhooks/whatsapp
  -> signature verification + idempotency guard
  -> media download + storage
  -> vision analysis service
  -> candidate diagnosis generation
  -> expert validation service
  -> confidence scoring
  -> WhatsApp reply formatter + sender
  -> PostgreSQL / Supabase persistence
  -> /admin dashboard
```

## Folder structure

```text
app/
  admin/
  api/
lib/
  config.ts
  db.ts
  prompts.ts
  schemas.ts
  types.ts
  admin-auth.ts
  providers/
  repositories/
  services/
docs/
supabase/schema.sql
tests/
.env.example
README.md
```

## Internal JSON contract

The orchestration pipeline returns this structure before any WhatsApp message is composed:

```json
{
  "plant_identification": { "name": "", "confidence": 0 },
  "health_assessment": { "status": "healthy | mild_stress | moderate_issue | severe_issue | unclear", "confidence": 0 },
  "observed_symptoms": [""],
  "likely_issues": [{ "name": "", "confidence": 0, "reasoning": "" }],
  "expert_validation": {
    "performed": true,
    "validation_strength": "strong | partial | weak | conflicting | unavailable",
    "source_types_used": [""],
    "summary": ""
  },
  "recommended_actions": [{ "priority": 1, "action": "", "why": "" }],
  "prevention_tips": [""],
  "follow_up_questions": [""],
  "escalation_needed": false,
  "escalation_reason": "",
  "image_quality": { "usable": true, "issues": [] },
  "final_confidence_score_1_to_10": 0
}
```

## Current implementation

### WhatsApp integration

Supported target providers:
- Meta WhatsApp Cloud API
- Twilio WhatsApp integration

Implemented now:
- Meta webhook verification endpoint
- X-Hub-Signature-256 validation
- Meta media URL resolution + media download
- outbound WhatsApp text sending
- idempotency check on inbound provider message id
- Twilio placeholder path for future extension

### Evidence validation strategy

Pipeline policy:
1. extract plant and symptom candidates from image
2. create diagnosis candidates conservatively
3. retrieve trusted source candidates
4. validate symptoms and treatment guidance against trusted source classes
5. lower confidence when validation is partial, weak, conflicting, or unavailable
6. ask follow-up questions when confidence < 7

Preferred source classes:
- university extension resources
- government agriculture resources
- botanical gardens
- horticulture organizations
- plant pathology references

### Admin dashboard

Implemented now:
- admin login
- case list
- search and filters
- case detail page
- operator notes
- diagnosis override actions

## Data model

Implemented in `supabase/schema.sql`.
Tables:
- users
- plants
- conversations
- messages
- uploaded_images
- diagnoses
- expert_validations
- treatment_recommendations
- follow_up_questions
- care_history

## Setup

```bash
npm install
cp .env.example .env.local
# fill env vars
npm run dev
```

Open:
- app: http://localhost:3000
- admin: http://localhost:3000/admin
- health: http://localhost:3000/api/health

## Database setup

Use Supabase SQL editor or local Postgres:

```sql
-- run supabase/schema.sql
```

## Deployment

### Vercel
- deploy the Next.js app
- set environment variables
- expose `/api/webhooks/whatsapp`
- point Meta webhook to `https://your-domain/api/webhooks/whatsapp`

### Railway / Render
- deploy as a web service
- connect Postgres / Supabase
- configure environment variables
- ensure webhook route is public

## Security and reliability checklist

Implemented now:
- verify Meta webhook token
- validate X-Hub-Signature-256
- provider message id idempotency check
- basic per-sender rate limiting
- raw webhook event archival
- persist inbound/outbound message records
- persist diagnosis case records
- upload inbound media into Supabase Storage when configured
- signed image URLs for admin review
- optional DB-backed async job queue path

Still recommended before launch:
- stronger admin auth / RBAC
- scrub secrets and PII from logs
- retry-safe outbound delivery records with provider receipts
- full worker scheduling / retries with backoff
- richer operator analytics and exports

## Test

```bash
npm run typecheck
npm test
npm run build
```

## Future-ready extensions

- web upload flow
- multilingual output
- Hebrew support
- care reminders
- subscriptions
- human expert escalation
- ongoing treatment monitoring

## Important implementation gaps before launch

- richer analytics, exports, and case override tooling
- signed/private image preview in admin
- stronger search grounding and allowlist management
- Twilio sender/parser if using Twilio
- background queue and dead-letter handling
- production auth and operator roles
