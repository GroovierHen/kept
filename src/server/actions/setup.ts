'use server'

import { getLocale } from 'next-intl/server'
import { z } from 'zod'
import { redirect } from '@/i18n/routing'
import { SETUP_STEPS } from '@/lib/setup-step'
import { getSignedInUser } from '@/server/auth/session'
import { withRetry } from '@/lib/retry'
import { db } from '@/server/db/client'
import { isTransientDbError, logDbRetry } from '@/server/db/transient-error'
import { recordSetupFinished } from '@/server/setup/record-setup-finished'
import { readSetupStep, saveStubStep } from '@/server/setup/stub-progress'
import { validatedAction } from './validated-action'

const LAST_STEP = SETUP_STEPS[SETUP_STEPS.length - 1]

const finishStubStep = validatedAction({
	input: z.object({ userId: z.uuid(), step: z.enum(SETUP_STEPS) }),
	handler: async ({ userId, step }) => {
		// A step only counts as the one the user is on, so a double tap can't skip the next.
		if ((await readSetupStep(userId)) !== step) return
		if (step === LAST_STEP) {
			// Safe to retry: recordSetupFinished records the Event once.
			await withRetry(() => db.$transaction((tx) => recordSetupFinished({ tx, userId })), {
				isRetryable: isTransientDbError,
				onRetry: logDbRetry
			})
		}
		await saveStubStep({ userId, step })
	}
})

// TEMPORARY, with the stub steps it serves (src/server/setup/stub-progress.ts).
// If it fails, the page shows the same step again with no message: real steps need better.
export async function continueSetup(formData: FormData): Promise<void> {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })

	await finishStubStep({ userId: user.id, step: formData.get('step') })
	return redirect({ href: '/setup', locale })
}
