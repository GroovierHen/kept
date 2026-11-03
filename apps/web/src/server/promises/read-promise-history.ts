import 'server-only'
import type { PromiseRecord } from '@/lib/adaptive'
import type { Prisma } from '@/server/db/client'

/**
 * What the adaptive engine reads, oldest first. The row holds a Promise's latest
 * wording and Size, because a change rewrites it, and the newest Report counts.
 */
export async function readPromiseHistory({
	client,
	userId
}: {
	client: Prisma.TransactionClient
	userId: string
}): Promise<PromiseRecord[]> {
	const promises = await client.promise.findMany({
		where: { userId },
		orderBy: { promiseDay: 'asc' },
		select: {
			planActionId: true,
			wording: true,
			size: true,
			reports: { orderBy: { createdAt: 'desc' }, take: 1, select: { answer: true } }
		}
	})
	return promises.map(({ planActionId, wording, size, reports }) => ({
		actionId: planActionId,
		wording,
		size,
		answer: reports[0]?.answer ?? null
	}))
}
