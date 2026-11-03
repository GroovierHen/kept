import 'server-only'
import { firstUnfinishedStep, type SetupProgress, type SetupStep } from '@/lib/setup-step'
import { db } from '@/server/db/client'
import { getPlanStatus } from '@/server/learn/learn'

// Setup's progress, read from what each step saved, never stored on its own.

async function readSetupProgress(userId: string): Promise<SetupProgress> {
	const [planStatus, user] = await Promise.all([
		getPlanStatus(userId),
		db.user.findUnique({
			where: { id: userId },
			select: {
				firstReminderTime: true,
				promises: { take: 1, select: { id: true } },
				plan: {
					select: {
						keyIdeas: { where: { taughtOn: { not: null } }, take: 1, select: { id: true } }
					}
				}
			}
		})
	])
	return {
		planStatus,
		hasLearnedFirstIdea: (user?.plan?.keyIdeas.length ?? 0) > 0,
		hasCommittedPromise: (user?.promises.length ?? 0) > 0,
		hasAddedReminder: user?.firstReminderTime != null
	}
}

/** Null once setup is finished. */
export async function readSetupStep(userId: string): Promise<SetupStep | null> {
	return firstUnfinishedStep(await readSetupProgress(userId))
}
