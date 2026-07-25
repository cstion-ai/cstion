# Google Sheets adapter

The repository does not yet connect to Google Sheets.

## Implemented

- [`SheetsAdapter`](../src/adapters/interfaces.ts) defines `appendBookingLead(booking, context)`. The context carries an idempotency key and retry policy, but no cancellation signal.
- [`FakeSheetsAdapter`](../src/adapters/fakes.ts) records calls and can simulate classified failures.
- The [Kakao pipeline](../src/pipelines/kakao-to-crm.ts) invokes the adapter after persisting a booking lead and applies the shared retry policy.
- The [runtime](../src/server/runtime.ts) uses the fake outside production and refuses production startup. [`GOOGLE_SHEET_ID`](../src/shared/config.ts) is parsed from configuration, but no Sheets API client or credential path is implemented.

## Required before production

A real adapter must add bounded request and retry timeouts, cancellation, typed failure classification, downstream idempotency and replay safety, provider-backed integration tests, and documented credential, privacy, and rollback handling. See the [production adapter gate](../docs/roadmap.md#production-adapter-gate) for acceptance evidence.
