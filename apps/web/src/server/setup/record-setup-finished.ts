import 'server-only'
import type { Prisma } from '@/server/db/client'
import { recordEvent } from '@/server/events/record-event'
import { toKeptDay } from '@/lib/kept-day'

// Results count a tester as Started from this Event, so it's saved once. Its
// idempotency key makes the database enforce that. The row lock (touching
// updatedAt) and the lookup still cover Events saved before keys existed,
// which have none. Takes the transaction so the last step can save its own
// change alongside it (ADR 0001).
export async function recordSetupFinished({
	tx,
	userId
}: {
	tx: Prisma.TransactionClient
	userId: string
}): Promise<void> {
	const { timeZone } = await tx.user.update({
		where: { id: userId },
		data: { updatedAt: new Date() },
		select: { timeZone: true }
	})
	const finished = await tx.event.findFirst({
		where: { userId, name: 'setup_finished' },
		select: { id: true }
	})
	if (finished != null) return
	await recordEvent({
		tx,
		event: {
			userId,
			name: 'setup_finished',
			keptDay: toKeptDay({ instant: new Date(), timeZone }),
			details: {},
			idempotencyKey: 'setup_finished'
		}
	})
}
