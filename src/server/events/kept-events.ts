import { z } from 'zod'

// Kept's own typed list of Events (GLOSSARY.md, ADR 0001): the record the ledger
// and results page are built from. It is separate from the PostHog taxonomy in
// src/lib/analytics/events.ts. Details hold only ids, enums and numbers. Each
// contract is strict and an id is a single lowercase token, which keeps sentences
// out of the table. It can't tell a lone word from an id, so never pass typed text.

const entityId = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/)
const keptDay = z.iso.date()
// Unique per user in the events table, so a repeated submission saves once.
// Built from names and ids, such as `report_made:<reportId>`.
const idempotencyKey = z.string().regex(/^[a-z0-9][a-z0-9_:-]{0,127}$/)

const size = z.enum(['small', 'medium', 'large'])
const moment = z.enum(['wake_up', 'lunch', 'after_work', 'before_bed'])
const answer = z.enum(['yes', 'partly', 'no'])
const recallScore = z.union([z.literal(0), z.literal(1), z.literal(2)])

const noDetails = z.strictObject({})

// A Typed promise has no Action or Size, so both are null.
const promiseDetails = z.strictObject({
	promiseId: entityId,
	promiseDay: keptDay,
	actionId: entityId.nullable(),
	size: size.nullable(),
	moment
})
const reportMadeDetails = z.strictObject({ promiseId: entityId, promiseDay: keptDay, answer })

// An Event's own keptDay is the day the tap happened. A Promise can be for a later
// day ("commit a Promise for tomorrow"), so its Events also carry promiseDay.
function eventContract<Name extends string, Details extends z.ZodType>({
	name,
	details
}: {
	name: Name
	details: Details
}) {
	return z.strictObject({
		userId: z.uuid(),
		name: z.literal(name),
		keptDay: keptDay.transform((day) => new Date(`${day}T00:00:00Z`)),
		details,
		idempotencyKey: idempotencyKey.optional()
	})
}

const keptEvent = z.discriminatedUnion('name', [
	eventContract({ name: 'signed_up', details: noDetails }),
	eventContract({ name: 'setup_finished', details: noDetails }),
	// build is 1 for the first plan and 2 after the one Try again (#30).
	eventContract({
		name: 'plan_generated',
		details: z.strictObject({ build: z.int().min(1).max(2) })
	}),
	eventContract({ name: 'plan_confirmed', details: noDetails }),
	eventContract({ name: 'reminder_added', details: noDetails }),
	eventContract({ name: 'promise_committed', details: promiseDetails }),
	// The Promise as it now stands, after a change before the 4am it closes at. The
	// latest Event for a promiseId describes it. promiseDay stays as committed.
	eventContract({ name: 'promise_changed', details: promiseDetails }),
	eventContract({ name: 'report_made', details: reportMadeDetails }),
	eventContract({
		name: 'lesson_taught',
		details: z.strictObject({ lessonId: entityId, skillId: entityId })
	}),
	eventContract({
		name: 'recall_graded',
		details: z.strictObject({ questionId: entityId, skillId: entityId, score: recallScore })
	}),
	eventContract({
		name: 'i_think_i_was_right_pressed',
		details: z.strictObject({ questionId: entityId })
	})
])

export type KeptEvent = z.input<typeof keptEvent>

export function parseEvent(input: unknown): z.output<typeof keptEvent> {
	return keptEvent.parse(input)
}

// The saved Events the ledger reads, checked against the contracts they were written with.
export const LEDGER_EVENT_NAMES = ['promise_committed', 'promise_changed', 'report_made'] as const

const savedLedgerEvent = z.discriminatedUnion('name', [
	z.object({ name: z.literal('promise_committed'), details: promiseDetails }),
	z.object({ name: z.literal('promise_changed'), details: promiseDetails }),
	z.object({ name: z.literal('report_made'), details: reportMadeDetails })
])

export function parseLedgerEvent(row: { name: string; details: unknown }) {
	return savedLedgerEvent.parse(row)
}
