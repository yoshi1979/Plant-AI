# Operations notes

## Health endpoint

`GET /api/health`

Returns:
- service name
- environment
- async processing flag
- queue configuration summary
- rate limit configuration summary

## Queue worker

Primary worker endpoint:
- `POST /api/internal/queue/process`

Required header:
- `x-queue-secret: <QUEUE_SECRET>`

## Log format

The app emits structured JSON logs with:
- timestamp
- level
- message
- sanitized metadata

Secrets and token-like fields are redacted.

## Recommended monitoring

- 5xx rate on `/api/webhooks/whatsapp`
- queue failures in `job_queue`
- delivery failures from outbound WhatsApp API responses
- rate limit spikes by sender
- long diagnosis latency
