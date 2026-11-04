import 'server-only'
import type { endpoints } from '@kept/contract'
import type { AppRouteHandler } from '@/server/api/app-handler'
import { readTodaySummary } from '@/server/today/read-today-summary'
import { requireSetUp } from './require-set-up'

export const getToday: AppRouteHandler<typeof endpoints.getToday> = async ({ user }) => {
	await requireSetUp(user.id)
	return readTodaySummary(user.id)
}
