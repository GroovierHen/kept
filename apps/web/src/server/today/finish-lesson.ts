import 'server-only'
import { db } from '@/server/db/client'
import { teachLesson } from '@/server/learn/teach-lesson'
import { readCheckIn } from './read-check-in'

/** "I learned this" on the Today screen: today's lesson counts as taught. Only today's can be. */
export async function finishTodaysLesson({
	userId,
	keyIdeaId
}: {
	userId: string
	keyIdeaId: string
}): Promise<void> {
	const { today } = await readCheckIn({ client: db, userId })
	await teachLesson({ userId, keyIdeaId, keptDay: today })
}
