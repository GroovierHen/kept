# Mobile app

`apps/mobile` is the Expo app (`@kept/mobile`). It shares a contract and a
look with the web app, and nothing else: no database, no server code, no
secret.

## Data goes through the API, defined once in the contract

- The phone reads and writes Kept's data only through `/api/app/v1/*` on the
  web app, with `api()` in `apps/mobile/src/lib/api.ts`. Never Prisma, never
  Supabase's `.from()`, never another service's SDK holding data.
- **Adding an endpoint is three edits:**
  1. Its entry in `packages/contract/src/v1/endpoints.ts`, with Zod schemas
     for the query or body it takes and the response it gives.
  2. Its handler in `apps/web/src/server/app-api/`, typed
     `AppRouteHandler<typeof endpoints.x>`.
  3. A route file under `apps/web/src/app/api/app/v1/` that holds only
     `export const GET = createAppRoute(endpoints.x, handler)`.
- `createAppRoute` (`apps/web/src/server/api/app-route.ts`) runs every step in
  order: the bearer token for a `user` endpoint (401 without one), input
  parsed with the contract (400), the handler, and the response parsed with
  the contract **before** it is sent (a wrong shape is a reported 500, never a
  malformed 200). Errors are `{ error: { code, message } }`, the message
  written for the person; throw `AppError` for one they caused.
- The app parses every response with the same contract and throws an
  `ApiError` on anything else. A screen shows the error's message and a way to
  try again; it never shows an empty state for a failed request.
- An endpoint the app ships against is a public API: a build in someone's
  pocket keeps calling it for months. Add fields; don't rename or remove one
  until no supported build reads it.

## One file owns each SDK

ESLint enforces each of these, as it does on the web:

- Supabase: `src/lib/supabase.ts`, sign-in only, typed to the auth surface.
- Sentry: `src/lib/observability.ts` (`captureError`) and `src/lib/logger.ts`.
- PostHog: `src/lib/analytics.ts`, whose typed event list uses the web's
  names and rules (docs/rules/analytics.md).
- `process.env`: `src/lib/env.ts`, which reads each `EXPO_PUBLIC_*` name
  spelled out (Expo inlines nothing else into a release build) and holds
  public client keys only. Everything in it ships inside the app.
- `console`: the logger only.

## Shared code lives in packages, and stays framework-free

`packages/contract` (Zod schemas) and `packages/brand` (design tokens) are
imported by both apps, so they hold no React, no Next.js and no React Native.
The web reads the brand as CSS variables from the generated
`packages/brand/brand.css` (run `pnpm --filter @kept/brand build:css` after
editing `src/tokens.ts`; a test fails when the two differ); the app reads the
values.

## Versions follow the Expo SDK

Add a mobile package with `pnpm expo install <name>` inside `apps/mobile`, not
`pnpm add`: it picks the version the installed Expo SDK is tested with. A
native package's newer npm release can break the native build. Upgrading the
SDK is its own change (`pnpm expo install expo@<next> --fix`, then
`pnpm --filter @kept/mobile doctor`).

## A build or an update

An over-the-air update (`.eas/workflows/publish-update.yml`) carries
JavaScript and assets. A new native package, a config plugin or an
`app.json` change needs a new store build. `runtimeVersion` follows Expo's
fingerprint policy, so an update only reaches builds whose native code
matches it. See `apps/mobile/README.md`, "Releasing".
