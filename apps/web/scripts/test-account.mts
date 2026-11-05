// Tests the daily loop on the live site without waiting for real days to pass,
// with a test account made through the normal sign-up. Reads DATABASE_URL from
// .env.local, which is the production database, so every command prints the
// host it is about to touch. Run from the repo root:
//
//   pnpm test-account:exclude you+test@gmail.com   once, after signing up
//   pnpm test-account:jump you+test@gmail.com 1    1 day passes; 2 makes an Empty day
//   pnpm test-account:status you+test@gmail.com    Day, Streak and Comebacks
//
// exclude keeps the account off the public Results page (GLOSSARY.md, Tester).
// jump refuses any account that still counts there, so a mistyped email can
// never move a real tester's data. Nothing is ever deleted.

import { z } from 'zod'
import { daysPass } from '../e2e/support/days-pass.ts'
import { dayNumber, keptDayFromDate, toKeptDay } from '../src/lib/kept-day.ts'
import { buildStreak, checkInDaysOf } from '../src/lib/streak.ts'
import { createPrismaClient } from '../src/server/db/create-client.ts'

// A week and a half is plenty to see a Streak grow, be forgiven and end.
const MAX_JUMP_DAYS = 10

const COMMANDS = ['exclude', 'jump', 'status'] as const
const args = z.tuple([z.enum(COMMANDS), z.email()]).rest(z.string())
const jumpDays = z.coerce.number().int().min(1).max(MAX_JUMP_DAYS)

const USAGE = `Usage:
  pnpm test-account:exclude <email>
  pnpm test-account:jump <email> [days, 1 to ${MAX_JUMP_DAYS}, default 1]
  pnpm test-account:status <email>`

function fail(message: string): never {
	console.error(message)
	process.exit(1)
}

const parsed = args.safeParse(process.argv.slice(2))
if (!parsed.success) fail(USAGE)
const [command, email, daysArg] = parsed.data

const databaseUrl = process.env.DATABASE_URL
if (databaseUrl == null || databaseUrl === '') fail('DATABASE_URL is not set: is .env.local there?')
console.log(`Database: ${new URL(databaseUrl).host}`)

// A jump moves every row the account has in one transaction, one round trip
// each. From a laptop to the hosted database that passes Prisma's 5 second
// default within a few days of use, and a timed-out transaction changes nothing.
const TRANSACTION_TIMEOUT_MS = 120_000
const TRANSACTION_MAX_WAIT_MS = 10_000

const db = createPrismaClient(databaseUrl, {
	transactionOptions: { maxWait: TRANSACTION_MAX_WAIT_MS, timeout: TRANSACTION_TIMEOUT_MS }
})

async function findAccount() {
	const user = await db.user.findUnique({
		where: { email },
		select: { id: true, email: true, isCountedInResults: true, isDemo: true }
	})
	return user ?? fail(`No account with the email ${email}. Sign up on the site first.`)
}

async function exclude() {
	const user = await findAccount()
	if (!user.isCountedInResults) {
		console.log(`${email} is already left off the Results page.`)
		return
	}
	await db.user.update({ where: { id: user.id }, data: { isCountedInResults: false } })
	console.log(`${email} is now a test account: left off the Results page, and jump works on it.`)
}

async function jump() {
	const days = jumpDays.safeParse(daysArg ?? 1)
	if (!days.success) fail(`Days must be a whole number from 1 to ${MAX_JUMP_DAYS}.`)
	const user = await findAccount()
	if (user.isDemo) fail(`Refusing: ${email} is the Demo account the judges use.`)
	if (user.isCountedInResults) {
		fail(
			`Refusing: ${email} counts on the Results page, so it could be a real tester.\n` +
				`If it's your test account, run: pnpm test-account:exclude ${email}`
		)
	}
	console.log('Moving the account back in time. This can take up to a minute...')
	await daysPass({ db, email, days: days.data })
	console.log(`${days.data} ${days.data === 1 ? 'day' : 'days'} passed for ${email}.`)
	await status()
}

async function status() {
	const user = await db.user.findUnique({
		where: { email },
		select: {
			isCountedInResults: true,
			timeZone: true,
			createdAt: true,
			events: { where: { name: 'promise_committed' }, select: { name: true, keptDay: true } }
		}
	})
	if (user == null) fail(`No account with the email ${email}. Sign up on the site first.`)
	const today = toKeptDay({ instant: new Date(), timeZone: user.timeZone })
	const streak = buildStreak({
		checkInDays: checkInDaysOf(
			user.events.map(({ name, keptDay }) => ({ name, keptDay: keptDayFromDate(keptDay) }))
		),
		today
	})
	const day = dayNumber({
		signUpDay: toKeptDay({ instant: user.createdAt, timeZone: user.timeZone }),
		today
	})
	console.log(
		[
			`${email}: Day ${day}`,
			`  Streak: ${streak.days} (best ${streak.best}), comebacks: ${streak.comebacks}`,
			`  Next Empty day: ${streak.isForgivenessReady ? 'forgiven' : 'ends the Streak'}`,
			`  Results page: ${user.isCountedInResults ? 'counted' : 'left off (test account)'}`
		].join('\n')
	)
}

try {
	await { exclude, jump, status }[command]()
} finally {
	await db.$disconnect()
}
