import 'server-only'
import { getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import type { KeptDay } from '@/lib/kept-day'
import { siteUrl } from '@/lib/seo/site'
import { db } from '@/server/db/client'

// What both forms of the reminder share, the .ics file and the Google Calendar link.
export interface ReminderDetails {
	readonly promiseDay: KeptDay
	readonly timeZone: string
	readonly title: string
	readonly details: string
	readonly todayUrl: string
}

/** Null until the user has a Promise for the reminder to start on. */
export async function readReminderDetails(userId: string): Promise<ReminderDetails | null> {
	const [user, t] = await Promise.all([
		db.user.findUnique({
			where: { id: userId },
			select: {
				timeZone: true,
				promises: { orderBy: { promiseDay: 'asc' }, take: 1, select: { promiseDay: true } }
			}
		}),
		getTranslations({ locale: routing.defaultLocale, namespace: 'SetupPage.reminder.calendar' })
	])
	const promiseDay = user?.promises[0]?.promiseDay
	if (user == null || promiseDay == null) return null

	const todayUrl = `${siteUrl()}/today`
	return {
		promiseDay: promiseDay.toISOString().slice(0, 10),
		timeZone: user.timeZone,
		title: t('title'),
		details: t('details', { url: todayUrl }),
		todayUrl
	}
}
