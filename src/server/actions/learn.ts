'use server'

import { getLocale } from 'next-intl/server'
import { z } from 'zod'
import { redirect } from '@/i18n/routing'
import { SAVE_FAILED_PARAM } from '@/lib/setup-step'
import { getSignedInUser } from '@/server/auth/session'
import { keptDayFor, teachLesson } from '@/server/learn/teach-lesson'
import { readSetupStep } from '@/server/setup/progress'
import { validatedAction } from './validated-action'

// Setup's key idea step (#31): Continue means the person has read it, so it
// counts as taught. If saving fails, the same lesson comes back saying so.

const learnFirst = validatedAction({
	input: z.object({ userId: z.uuid(), keyIdeaId: z.uuid() }),
	handler: async ({ userId, keyIdeaId }) => {
		// Only from the key idea step, so a stale tab can't teach around setup.
		if ((await readSetupStep(userId)) !== 'keyIdea') return
		await teachLesson({ userId, keyIdeaId, keptDay: await keptDayFor(userId) })
	}
})

export async function learnFirstKeyIdea(formData: FormData): Promise<void> {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })

	const result = await learnFirst({ userId: user.id, keyIdeaId: formData.get('keyIdeaId') })
	return redirect({
		href: result.ok ? '/setup' : { pathname: '/setup', query: { [SAVE_FAILED_PARAM]: '1' } },
		locale
	})
}
