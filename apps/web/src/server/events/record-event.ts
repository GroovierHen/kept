import 'server-only'
import type { Prisma } from '@/server/db/client'
import { parseEvent, type KeptEvent } from './kept-events'

// Takes the transaction, not the client: an Event is saved in the same
// transaction as the change it records (ADR 0001), so the two can't disagree.
// The caller passes the Kept day from src/lib/kept-day.ts.
//
// An Event with an idempotencyKey is saved once per user: a repeat with the
// same key is skipped by the unique index, so double taps, retries and
// replayed entries are safe. Returns whether this call saved it.
export async function recordEvent({
	tx,
	event
}: {
	tx: Prisma.TransactionClient
	event: KeptEvent
}): Promise<boolean> {
	const { count } = await tx.event.createMany({
		data: [parseEvent(event)],
		skipDuplicates: true
	})
	return count === 1
}
