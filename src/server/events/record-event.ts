import 'server-only'
import type { Prisma } from '@/server/db/client'
import { parseEvent, type KeptEvent } from './kept-events'

// Takes the transaction, not the client: an Event is saved in the same
// transaction as the change it records (ADR 0001), so the two can't disagree.
// The caller passes the Kept day from src/lib/kept-day.ts.
export async function recordEvent({
	tx,
	event
}: {
	tx: Prisma.TransactionClient
	event: KeptEvent
}): Promise<void> {
	await tx.event.create({ data: parseEvent(event) })
}
