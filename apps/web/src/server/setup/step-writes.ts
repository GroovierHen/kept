import 'server-only'
import type { PromiseChoice } from '@/lib/promise'
import { keptDayFor, teachLesson } from '@/server/learn/teach-lesson'
import { addReminder } from './add-reminder'
import { commitFirstPromise } from './commit-first-promise'
import { readSetupStep } from './progress'

// Setup's last three writes, each only from its own step, so a stale tab or an
// old app screen can't teach, promise or finish around an earlier step. Out of
// step, each does nothing: the caller reads setup again and shows what's true.

/** The first key idea: Continue means the person has read it, so it counts as taught. */
export async function learnFirstKeyIdea({
	userId,
	keyIdeaId
}: {
	userId: string
	keyIdeaId: string
}): Promise<void> {
	if ((await readSetupStep(userId)) !== 'keyIdea') return
	await teachLesson({ userId, keyIdeaId, keptDay: await keptDayFor(userId) })
}

/** The first Promise, for the day after setup. */
export async function commitSetupPromise({
	userId,
	choice
}: {
	userId: string
	choice: PromiseChoice
}): Promise<void> {
	if ((await readSetupStep(userId)) !== 'promise') return
	await commitFirstPromise({ userId, choice })
}

/** The daily reminder's time, which finishes setup. */
export async function saveSetupReminder({
	userId,
	time
}: {
	userId: string
	time: string
}): Promise<void> {
	if ((await readSetupStep(userId)) !== 'reminder') return
	await addReminder({ userId, time })
}
