import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { track } from './analytics'
import { log } from './logger'

/**
 * The daily check-in reminder, scheduled on the phone itself at the time the
 * person picked in setup. A local notification: no push service, no server
 * schedule. Rescheduled whenever the time is read, and cancelled on sign-out.
 */
const REMINDER_ID = 'daily-check-in'
const CHANNEL_ID = 'reminders'

export const REMINDER_CONTENT = {
	title: 'Time to check in',
	body: 'Did you keep today’s promise? It takes a minute.'
} as const

/** "HH:MM" to hour and minute; null for anything else. */
export function parseReminderTime(time: string): { hour: number; minute: number } | null {
	const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time)
	if (match == null) return null
	return { hour: Number(match[1]), minute: Number(match[2]) }
}

export type ReminderPermission = 'granted' | 'denied' | 'undetermined'

export async function reminderPermission(): Promise<ReminderPermission> {
	const { status } = await Notifications.getPermissionsAsync()
	return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined'
}

/** Asks once; the system remembers the answer and never asks again. */
export async function askForReminders(): Promise<ReminderPermission> {
	track('permission_prompted', { permission: 'notifications' })
	const { status } = await Notifications.requestPermissionsAsync()
	const granted = status === 'granted'
	track(granted ? 'permission_approved' : 'permission_denied', { permission: 'notifications' })
	return granted ? 'granted' : 'denied'
}

export async function scheduleDailyReminder(time: string): Promise<boolean> {
	const at = parseReminderTime(time)
	if (at == null || (await reminderPermission()) !== 'granted') return false
	if (Platform.OS === 'android') {
		await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
			name: 'Daily check-in',
			importance: Notifications.AndroidImportance.DEFAULT
		})
	}
	await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => undefined)
	await Notifications.scheduleNotificationAsync({
		identifier: REMINDER_ID,
		content: { ...REMINDER_CONTENT, data: { url: '/today' } },
		trigger: {
			type: Notifications.SchedulableTriggerInputTypes.DAILY,
			hour: at.hour,
			minute: at.minute,
			channelId: CHANNEL_ID
		}
	})
	log.info('Daily reminder scheduled', { hour: at.hour, minute: at.minute })
	return true
}

export async function cancelDailyReminder(): Promise<void> {
	await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => undefined)
}

// A reminder that arrives while Kept is open still shows, quietly.
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldPlaySound: false,
		shouldSetBadge: false,
		shouldShowBanner: true,
		shouldShowList: true
	})
})
