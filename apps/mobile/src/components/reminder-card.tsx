import { useEffect, useState } from 'react'
import { Linking } from 'react-native'
import { copy } from '@/copy'
import { captureError } from '@/lib/observability'
import {
	askForReminders,
	reminderPermission,
	scheduleDailyReminder,
	type ReminderPermission
} from '@/lib/reminders'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Text } from './ui/text'

/**
 * The daily reminder at the time picked in setup. Asking is the person's
 * choice (a button, never a prompt at launch); once allowed, it is
 * rescheduled each time Today loads, so a time changed on the web follows.
 */
export function ReminderCard({ time }: { time: string }) {
	const [permission, setPermission] = useState<ReminderPermission | null>(null)

	useEffect(() => {
		let isCurrent = true
		void reminderPermission().then((status) => {
			if (isCurrent) setPermission(status)
		})
		return () => {
			isCurrent = false
		}
	}, [])

	useEffect(() => {
		if (permission === 'granted') scheduleDailyReminder(time).catch(captureError)
	}, [permission, time])

	if (permission == null) return null
	return (
		<Card>
			{permission === 'granted' && <Text>{copy.today.reminder.on(time)}</Text>}
			{permission === 'undetermined' && (
				<Button
					variant="secondary"
					label={copy.today.reminder.ask(time)}
					onPress={() => void askForReminders().then(setPermission)}
				/>
			)}
			{permission === 'denied' && (
				<>
					<Text tone="muted">{copy.today.reminder.off}</Text>
					<Button
						variant="quiet"
						label={copy.today.reminder.settings}
						onPress={() => void Linking.openSettings()}
					/>
				</>
			)}
		</Card>
	)
}
