import 'server-only'
import type { endpoints } from '@kept/contract'
import type { AppRouteHandler } from '@/server/api/app-handler'
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
