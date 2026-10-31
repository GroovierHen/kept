import 'server-only'
import { cookies } from 'next/headers'
import {
	firstUnfinishedStep,
	SETUP_STEPS,
	type SetupProgress,
	type SetupStep
} from '@/lib/setup-step'
import { db } from '@/server/db/client'
import { getPlanStatus } from '@/server/learn/learn'

// TEMPORARY: the only place setup's one unbuilt step is faked. A cookie stands in
// for hasLearnedFirstIdea until #31 saves it. Then delete the cookie.

const COOKIE_PREFIX = 'kept_setup_stub_'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

async function readDoneSteps(userId: string): Promise<SetupStep[]> {
	const cookieStore = await cookies()
	const saved = cookieStore.get(`${COOKIE_PREFIX}${userId}`)?.value.split(',') ?? []
	return SETUP_STEPS.filter((step) => saved.includes(step))
}

async function readSetupProgress(userId: string): Promise<SetupProgress> {
	const [done, planStatus, user] = await Promise.all([
		readDoneSteps(userId),
		getPlanStatus(userId),
		db.user.findUnique({
			where: { id: userId },
			select: { firstReminderTime: true, promises: { take: 1, select: { id: true } } }
		})
	])
	return {
		planStatus,
		hasLearnedFirstIdea: done.includes('keyIdea'),
		hasCommittedPromise: (user?.promises.length ?? 0) > 0,
		hasAddedReminder: user?.firstReminderTime != null
	}
}

/** Null once setup is finished. */
export async function readSetupStep(userId: string): Promise<SetupStep | null> {
	return firstUnfinishedStep(await readSetupProgress(userId))
}

export async function saveStubStep({
	userId,
	step
}: {
	userId: string
	step: SetupStep
}): Promise<void> {
	const done = await readDoneSteps(userId)
	const cookieStore = await cookies()
	cookieStore.set(`${COOKIE_PREFIX}${userId}`, [...done, step].join(','), {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: COOKIE_MAX_AGE_SECONDS,
		path: '/'
	})
}
