# A failure delays an entry, it never loses it

Every write a person makes is safe to repeat, so anything that fails can be tried again: a repeated submission carries an idempotency key that Postgres keeps once (`Event.idempotencyKey`, unique per user), and entity tables carry their own unique key (one Promise per user per Kept day). Calls that fail for a moment are retried with exponential backoff and jitter (`src/lib/retry.ts`): dropped or busy database connections (`isTransientDbError`), Supabase network failures and 5xx responses (`retryAuthCall`), and the Gemini calls when they land. Entries a person types are saved on the device first and sent from an outbox (`src/lib/outbox.ts`) until the server confirms them, with the entry's id as its idempotency key. We considered a server-side job queue instead, but the failure that loses typed data is the request never reaching us, which only the device can cover; a server queue stays the plan for work we start ourselves, such as building a plan while Gemini is down.

## Consequences

- A new write path takes an idempotency key and is tested for a repeat. Retrying anything that isn't safe to repeat is a bug, because a call that "failed" may have succeeded before its answer was lost.
- The outbox never holds passwords or tokens: it is plain device storage.
- Sign-up treats "email taken" after its own retry as a lost answer, and signs in with the same password to prove the account is the person's.

## Scale

Checked against a results page that reads every Event, and the tables Act and Learn add next:

- `events` ids are UUIDv7, time-ordered, so inserts append to the primary key index rather than splitting pages across it.
- `events` is read by user and Kept day (ledger, `(user_id, kept_day)`) and by name and Kept day (results, `(name, kept_day)`). Filtering on `details` JSON at scale needs the value promoted to a column or an expression index first; the loop's own reads go to the state tables (ADR 0001).
- New tables need these from the start: `Promise` unique on `(user_id, kept_day)`, `Report` indexed on `(promise_id, created_at)` so "latest report" is one index read, `Review` indexed on `(user_id, due_kept_day)`, `RecallAttempt` indexed on `(key_idea_id, created_at)`.
- The results page counts across all testers on every view. That is fine for a cohort; past a few thousand users it reads from a daily rollup table filled by the cron route instead.
- `DATABASE_URL` caps Prisma at one connection per serverless instance (`connection_limit=1`) through the transaction pooler.
