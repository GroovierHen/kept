import 'server-only'
import type { endpoints } from '@kept/contract'
import { AppError } from '@/lib/errors/app-error'
import { resolveTimeZone } from '@/lib/kept-day'
import type { AppRouteHandler } from '@/server/api/app-handler'
import { provisionUser } from '@/server/auth/provision-user'
import { db } from '@/server/db/client'
import { readSetupStep } from '@/server/setup/progress'

export const getMe: AppRouteHandler<typeof endpoints.getMe> = async ({ user }) => {
	const [setupStep, row] = await Promise.all([
		readSetupStep(user.id),
		db.user.findUnique({ where: { id: user.id }, select: { firstReminderTime: true } })
	])
	return {
		user: { id: user.id, email: user.email },
		setupStep,
		reminderTime: row?.firstReminderTime ?? null
	}
}

/**
 * The phone's sign-in and sign-up save the account row here, as the web's do
 * (src/server/actions/auth.ts). Safe to repeat: an existing row keeps its time
 * zone. A failure is a 500 the app retries before showing anything.
 */
export const provisionMe: AppRouteHandler<typeof endpoints.provisionMe> = async (input) => {
	const { user, body } = input
	if (user.email == null) {
		throw new AppError('This account has no email address, so it can’t be set up here.', {
			status: 400,
			code: 'email_missing'
		})
	}
	await provisionUser({
		id: user.id,
		email: user.email,
		timeZone: resolveTimeZone(body.timeZone)
	})
	return getMe({ ...input, body: undefined })
}
