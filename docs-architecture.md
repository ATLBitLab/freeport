# Freeport architecture notes

## Boundaries

Freeport owns listing discovery, seller metadata, listing fee enforcement, and signed-event storage. It does not execute or broker the downstream service advertised by a listing in v1.

## Event model

Listing events use the Nostr canonical payload:

```json
[0, "<pubkey>", <created_at>, <kind>, <tags>, "<content>"]
```

The event id is the SHA-256 hash of that serialized payload. The signature is a Schnorr signature over the event id using the seller-controlled private key.

Kinds:
- `33000`: seller profile
- `33001`: listing
- `33002`: listing deactivation

## Storage model

Postgres stores normalized listing rows for search and browse performance. `listing_events` stores append-only event records with the canonical event JSON for verification and reconstruction.

## Payment model

The listing fee is one payment per listing. In production, `POST /api/listings` is L402-gated by Money Dev Kit at 50 USD cents. A successful paid credential is consumed by MDK and Freeport stores a `listing_fee_payments` audit row.

## Local demo mode

If Supabase is not configured, route handlers use an in-memory seeded repository. If Money Dev Kit is not configured and the app is not running in production, `/api/listing-fee/request` returns a paid development receipt so the end-to-end listing flow remains demoable.
