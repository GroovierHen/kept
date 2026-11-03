import 'server-only'
import type { endpoints } from '@kept/contract'
import { AppError } from '@/lib/errors/app-error'
import type { AppRouteHandler } from '@/server/api/app-handler'
import { readSetupStep } from '@/server/setup/progress'
import { readTodaySummary } from '@/server/today/read-today-summary'

export const getToday: AppRouteHandler<typeof endpoints.getToday> = async ({ user }) => {
	// The web sends an unfinished setup to /setup; the app asks getMe first and
	// does the same, so reaching this is the app's mistake, not a crash.
	if ((await readSetupStep(user.id)) != null) {
		throw new AppError('Finish setting up first.', { status: 404, code: 'setup_unfinished' })
	}
	return readTodaySummary(user.id)
}
