# Plant Health Assistant

Production-oriented scaffold for a WhatsApp-first AI plant health assistant built with Next.js, TypeScript, PostgreSQL/Supabase, and a modular diagnosis pipeline.

## What it does

- Accepts inbound WhatsApp image webhooks
- Runs a structured plant-analysis pipeline
- Validates diagnosis against trusted expert source types before replying
- Returns a WhatsApp-friendly diagnosis with a 1-10 confidence score
- Stores case-ready entities for users, messages, plants, diagnoses, validations, and care history
- Provides a lightweight admin dashboard

## Architecture

```text
WhatsApp (Meta or Twilio)
  -> /api/webhooks/whatsapp
  -> media normalization + idempotency guard
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
  admin/page.tsx
  api/
    admin/cases/route.ts
    health/route.ts
    webhooks/whatsapp/route.ts
lib/
  config.ts
  db.ts
  prompts.ts
  types.ts
  providers/whatsapp.ts
  repositories/cases.ts
  services/
    confidence.ts
    formatter.ts
    orchestrator.ts
    validation.ts
    vision.ts
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

## Production notes

### 1. WhatsApp integration

Supported target providers:
- Meta WhatsApp Cloud API
- Twilio WhatsApp integration

Current scaffold includes:
- Meta webhook verification
- Meta outbound text send
- A Twilio placeholder adapter for extension

### 2. Evidence validation strategy

Do not trust raw vision output alone.

Pipeline policy:
1. extract plant and symptom candidates from image
2. create diagnosis candidates conservatively
3. validate symptoms and treatment guidance against trusted source types
4. lower confidence when validation is partial, weak, conflicting, or unavailable
5. ask follow-up questions when confidence < 7

Preferred source classes:
- university extension resources
- government agriculture resources
- botanical gardens
- horticulture organizations
- plant pathology references

### 3. Confidence scoring

The final confidence score reflects:
- image usability
- plant identification certainty
- symptom clarity
- issue certainty
- validation strength

### 4. Data model

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

- verify Meta webhook token
- add X-Hub-Signature-256 validation before production launch
- implement provider message id idempotency in the database
- use signed/private media URLs
- add rate limiting per sender
- scrub secrets and PII from logs
- add retry-safe outbound delivery records
- store raw webhook events for audits

## Admin dashboard requirements covered

Current admin page shows a case list. Extend with:
- number search
- case detail page
- image preview
- annotation / override actions
- export case history
- recurring issue analytics by plant type

## Error handling plan

The app should gracefully handle:
- no image sent
- unsupported media
- blurry or dark photo
- multiple plants in one image
- plant unknown
- conflicting expert validation
- provider timeout / duplicate webhooks
- storage failures

Recommended behavior:
- explain limitation clearly
- request better images when needed
- lower confidence score
- avoid false certainty
- escalate when severe or unclear

## Sample WhatsApp reply

```text
Plant: Monstera deliciosa
Overall status: mild stress
Confidence score: 8/10

What I see:
- yellowing lower leaves
- mild drooping
- dark, wet-looking potting mix

Likely issue:
- Likely overwatering
- Secondary possibility: early root stress

Validated against expert guidance:
- Cross-checked against trusted plant expert sources
- Validation strength: strong
- Symptoms and first-line treatment matched extension-style guidance.

What to do now:
1. Pause watering until the top layer dries.
2. Make sure excess water can drain fully.
3. Remove any mushy or collapsing leaves.

Prevention:
- Water based on soil dryness, not calendar timing.
- Keep the pot in bright indirect light.

Urgency: Low
```

## Test

```bash
npm test
```

## Future-ready extensions

- web upload flow
- multilingual output
- Hebrew support
- care reminders
- subscriptions
- human expert escalation
- ongoing treatment monitoring

## Important implementation gap to close before launch

This scaffold is production-oriented, but not fully production-complete until you wire:
- real vision model calls
- real expert web retrieval / RAG over vetted horticulture sources
- durable persistence repository methods
- webhook signature verification
- Twilio sender/parser if using Twilio
- auth for admin UI
- background queue for media download / inference / retries
