import * as Notifications from 'expo-notifications'
import { parseReminderTime, scheduleDailyReminder } from '../reminders'

jest.mock('expo-notifications', () => ({
	getPermissionsAsync: jest.fn(),
	requestPermissionsAsync: jest.fn(),
	setNotificationChannelAsync: jest.fn(),
	cancelScheduledNotificationAsync: jest.fn(async () => undefined),
	scheduleNotificationAsync: jest.fn(async () => 'daily-check-in'),
	setNotificationHandler: jest.fn(),
	AndroidImportance: { DEFAULT: 3 },
	SchedulableTriggerInputTypes: { DAILY: 'daily' }
}))
jest.mock('../analytics', () => ({ track: jest.fn() }))

test('reads HH:MM and nothing else', () => {
	expect(parseReminderTime('20:00')).toEqual({ hour: 20, minute: 0 })
	expect(parseReminderTime('07:45')).toEqual({ hour: 7, minute: 45 })
	expect(parseReminderTime('24:00')).toBeNull()
	expect(parseReminderTime('8pm')).toBeNull()
})

test('schedules one daily reminder at the picked time, replacing any earlier one', async () => {
	jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' } as never)
	await expect(scheduleDailyReminder('07:45')).resolves.toBe(true)
	expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('daily-check-in')
	expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
		expect.objectContaining({
			identifier: 'daily-check-in',
			trigger: expect.objectContaining({ type: 'daily', hour: 7, minute: 45 })
		})
	)
})

test('schedules nothing without permission', async () => {
	jest.mocked(Notifications.scheduleNotificationAsync).mockClear()
	jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'denied' } as never)
	await expect(scheduleDailyReminder('20:00')).resolves.toBe(false)
	expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled()
})
