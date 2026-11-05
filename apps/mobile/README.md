# Kept mobile (`@kept/mobile`)

The Kept app for iOS and Android: Expo SDK 58, React Native 0.88, Expo Router.
Someone can sign up, set up (goal, the AI's plan, the first key idea, promise
and reminder), check in every day (report, recall, the day's key idea, the
next promise) and be reminded to, all through the web app's API.

## How it fits together

- **Data comes from the web app, never the database.** `src/lib/api.ts` calls
  `/api/app/v1/*` on the web app (`apps/web/src/app/api/app/v1/`) with the
  Supabase access token as `Authorization: Bearer …`. The phone holds no
  database credential and no server key.
- **One contract for both sides.** Every route is defined once in
  `packages/contract` (method, path, auth, Zod schemas). The web validates
  each response with it before sending; the app parses each response with it
  on arrival. A change one side doesn't follow fails that side's typecheck.
- **The routes**, all in `packages/contract/src/v1/endpoints.ts`:
  - `GET`/`POST /me`: who is signed in; the POST saves the account row on
    the first read after a sign-in.
  - `GET /setup` and one `POST` per setup step (`setup/goal`, `setup/plan`,
    `setup/plan/rebuild`, `setup/plan/action`, `setup/plan/confirm`,
    `setup/key-idea`, `setup/promise`, `setup/reminder`).
  - `GET /today`, the check-in step and what it shows, and its writes
    (`today/report`, `today/recall`, `today/lesson`, `today/promise`,
    `today/promise-change`).
  - `GET /ledger`.
- **Screens**: sign-in and sign-up while signed out; setup until it's
  finished; then two tabs, Today and Ledger (`src/app/(tabs)`).
- **One look.** Colours, radii and fonts come from `packages/brand`, the same
  tokens the web app's `.theme-brand` pages are built from.
- **Supabase is sign-in and sign-up only** (`src/lib/supabase.ts`, the only
  file that may import it). The first read after signing in saves the
  account row with the phone's time zone (`src/lib/account.ts`), as the web's
  sign-in does.
- **Reminders are local notifications** (`src/lib/reminders.ts`), scheduled on
  the phone at the time picked in setup's last step. No push service is
  involved.

## Running it

From the repo root, after `pnpm install`:

```bash
pnpm mobile:ios       # build the development app and open it in the iOS Simulator
pnpm mobile           # start Metro for an installed development build
```

The first `mobile:ios` generates `ios/` (gitignored, Continuous Native
Generation) and runs CocoaPods. If `pod install` fails with
`Unicode Normalization not appropriate for ASCII-8BIT`, the shell's locale
isn't UTF-8: `export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8` and run it again.

Expo Go can't run this app (it has native modules Expo Go doesn't ship); use
the development build.

### Against a local stack, without touching production

`apps/web/.env.local` points at the production database, so for the phone use
the browser tests' stack instead: a throwaway Postgres, the fake Supabase Auth
in `apps/web/e2e/support/fake-services.ts`, and the web app with no
`.env.local`.

```bash
docker run -d --rm --name kept-e2e-pg -p 54329:5432 -e POSTGRES_PASSWORD=postgres postgres:16
```

Then start `fake-services` (port 3101) and `web-local-stack` (port 3100) from
`.claude/launch.json`, and run one browser test to create a set-up user:

```bash
pnpm --filter @kept/web exec playwright test e2e/first-check-in.spec.ts
```

Stop those two servers first (the test starts its own), then start them again.
Put this in `apps/mobile/.env.local`, and sign in on the phone with the email
the test created (any password; the fake doesn't check it):

```
EXPO_PUBLIC_SITE_URL=http://localhost:3100
EXPO_PUBLIC_SUPABASE_URL=http://localhost:3101
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=fake-publishable-key
```

## Environment variables

Read in one place, `src/lib/env.ts`; `.env.example` explains each. Only
`EXPO_PUBLIC_*` names, every one shipped inside the app, so only public client
keys: the web app's URL, the Supabase URL and publishable key, a Sentry DSN,
a PostHog project key. Unset or `REPLACE_…` turns that feature off rather
than crashing.

`.env.local` covers local runs. Builds and updates read EAS environment
variables (development, preview, production) instead.

## Checks

`pnpm lint`, `pnpm typecheck` and `pnpm test` at the root cover this app with
the rest. On its own: `pnpm --filter @kept/mobile test` (Jest, `jest-expo`)
and `pnpm --filter @kept/mobile doctor` (expo-doctor). ESLint keeps the
Supabase, Sentry and PostHog SDKs, `process.env` and `console` each to the
one file that owns them; `pnpm check:standards` confirms it.

## Trying it against the live site, with nothing running locally

The `simulator` build profile makes an iOS Simulator app on EAS's servers,
with the JavaScript inside it, pointed at `https://kept-swart.vercel.app` and
the production Supabase through the `preview` environment's variables. No
Metro, no Docker, no Xcode build on the Mac, and no Apple account:

```bash
cd apps/mobile
pnpm dlx eas-cli@latest build --platform ios --profile simulator
pnpm dlx eas-cli@latest build:run --platform ios --latest
```

It signs in to real accounts and real data, so use a test account. A later
JavaScript change reaches it with
`pnpm dlx eas-cli@latest update --channel preview`; a new native package needs
another build.

## Releasing

Linked to the Expo project `@wakechromium/kept` (`extra.eas.projectId` and
`updates.url` in `app.json`). What's left before the stores:

1. Confirm the bundle identifier (`app.kept.mobile` in `app.json`, a
   placeholder) before the first store build; it can't change after.
2. Set the EAS environment variables for `production` (the `preview` ones
   are set: the site URL and the Supabase URL and publishable key), and
   `SENTRY_AUTH_TOKEN` (secret) plus `SENTRY_ORG` and `SENTRY_PROJECT` for
   source maps.

After that, `eas.json` holds the build profiles (`development`, `preview`,
`simulator`, `production`) and `.eas/workflows/publish-update.yml` publishes
over-the-air updates. An update carries JavaScript and assets only, so it
suits a copy or logic fix. A new native package or a change to `app.json`
plugins needs a new build; `runtimeVersion` uses Expo's fingerprint policy,
so an update is only offered to builds whose native code matches it.
