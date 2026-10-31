import 'server-only'
import { cookies } from 'next/headers'
import {
	firstUnfinishedStep,
	SETUP_STEPS,
	type SetupProgress,
	type SetupStep
} from '@/lib/setup-step'
import { getPlanStatus } from '@/server/learn/learn'

// TEMPORARY: the only place setup's unbuilt steps are faked, so the flow can be
// walked before they land. A cookie keeps fake progress out of the database, but
// the last step still saves a real setup_finished Event, so anyone who walks these
// counts as Started. Replace each field in readSetupProgress as its piece lands:
// planStatus is real (#29, #30), hasLearnedFirstIdea (#31),
// hasCommittedPromise (#13), hasAddedReminder (#14). Then delete the cookie.

const COOKIE_PREFIX = 'kept_setup_stub_'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

async function readDoneSteps(userId: string): Promise<SetupStep[]> {
	const cookieStore = await cookies()
	const saved = cookieStore.get(`${COOKIE_PREFIX}${userId}`)?.value.split(',') ?? []
	return SETUP_STEPS.filter((step) => saved.includes(step))
}

async function readSetupProgress(userId: string): Promise<SetupProgress> {
	const [done, planStatus] = await Promise.all([readDoneSteps(userId), getPlanStatus(userId)])
	const isDone = (step: SetupStep) => done.includes(step)
	return {
		planStatus,
		hasLearnedFirstIdea: isDone('keyIdea'),
		hasCommittedPromise: isDone('promise'),
		hasAddedReminder: isDone('reminder')
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
