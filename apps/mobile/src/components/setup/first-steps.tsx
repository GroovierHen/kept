import { useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import type { SetupView } from '@kept/contract'
import { copy } from '@/copy'
import { useCommitFirstPromise, useLearnFirstKeyIdea, useSaveReminder } from '@/hooks/use-setup'
import { errorMessage } from '@/lib/api'
import { captureError } from '@/lib/observability'
import { askForReminders, scheduleDailyReminder } from '@/lib/reminders'
import { fontFamily, space } from '@/lib/theme'
import { LessonCard } from '../check-in/lesson-step'
import { PromisePicker } from '../check-in/promise-picker'
import { StepHeading } from '../check-in/step-heading'
import { Button } from '../ui/button'
import { Text } from '../ui/text'

/** Setup's first key idea: Continue means it was read, so it counts as taught. */
export function KeyIdeaStep({
	view,
	eyebrow
}: {
	view: Extract<SetupView, { step: 'keyIdea' }>
	eyebrow: string
}) {
	const learn = useLearnFirstKeyIdea()
	const { lesson } = view
	return (
		<View style={styles.step}>
			<StepHeading
				eyebrow={eyebrow}
				title={copy.setup.steps.keyIdea}
				lead={copy.setup.keyIdea.lead}
			/>
			{lesson != null && <LessonCard lesson={lesson} eyebrow={copy.lesson.eyebrow} />}
			{learn.isError && (
				<Text tone="danger" accessibilityRole="alert">
					{errorMessage(learn.error)}
				</Text>
			)}
			{lesson != null && (
				<Button
					label={copy.setup.continue}
					isPending={learn.isPending}
					onPress={() => learn.mutate(lesson.keyIdeaId)}
				/>
			)}
		</View>
	)
}

/** The first Promise, for tomorrow: the plan's actions at their small size. */
export function FirstPromiseStep({
	view,
	eyebrow
}: {
	view: Extract<SetupView, { step: 'promise' }>
	eyebrow: string
}) {
	const commit = useCommitFirstPromise()
	return (
		<View style={styles.step}>
			<StepHeading
				eyebrow={eyebrow}
				title={copy.setup.steps.promise}
				lead={copy.setup.promise.lead}
			/>
			<PromisePicker
				actions={view.actions}
				initial={null}
				onSubmit={(choice) => commit.mutate(choice)}
				isPending={commit.isPending}
				error={commit.isError ? errorMessage(commit.error) : null}
			/>
		</View>
	)
}

const DEFAULT_HOUR = 20
const TWO_DIGITS = 2

/** "HH:MM", the form the server saves a reminder time in. */
export function reminderTimeOf(date: Date): string {
	const pad = (value: number) => String(value).padStart(TWO_DIGITS, '0')
	return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function defaultReminder(): Date {
	const date = new Date()
	date.setHours(DEFAULT_HOUR, 0, 0, 0)
	return date
}

/**
 * The daily reminder, as a notification on this phone. Asking is the person's
 * tap; a "no" still saves the time and finishes setup, and Today says how to
 * turn notifications on later.
 */
export function ReminderStep({ eyebrow }: { eyebrow: string }) {
	const save = useSaveReminder()
	const [time, setTime] = useState(defaultReminder)
	const [isAsking, setIsAsking] = useState(false)
	const [isShowingPicker, setIsShowingPicker] = useState(Platform.OS === 'ios')

	function pick(event: DateTimePickerEvent, picked?: Date) {
		if (Platform.OS === 'android') setIsShowingPicker(false)
		if (event.type === 'set' && picked != null) setTime(picked)
	}

	async function submit() {
		const at = reminderTimeOf(time)
		setIsAsking(true)
		try {
			if ((await askForReminders()) === 'granted') await scheduleDailyReminder(at)
		} catch (error) {
			// The phone said no or failed to schedule: the time still saves, and Today offers it again.
			captureError(error)
		} finally {
			setIsAsking(false)
		}
		save.mutate(at)
	}

	return (
		<View style={styles.step}>
			<StepHeading
				eyebrow={eyebrow}
				title={copy.setup.steps.reminder}
				lead={copy.setup.reminder.body}
			/>
			<Text variant="small" style={styles.label}>
				{copy.setup.reminder.timeLabel}
			</Text>
			{Platform.OS === 'android' && (
				<Button
					variant="secondary"
					label={reminderTimeOf(time)}
					onPress={() => setIsShowingPicker(true)}
				/>
			)}
			{isShowingPicker && (
				<DateTimePicker
					value={time}
					mode="time"
					display={Platform.OS === 'ios' ? 'spinner' : 'default'}
					onChange={pick}
					accessibilityLabel={copy.setup.reminder.timeLabel}
				/>
			)}
			{save.isError && (
				<Text tone="danger" accessibilityRole="alert">
					{errorMessage(save.error)}
				</Text>
			)}
			<Button
				label={copy.setup.reminder.submit}
				isPending={isAsking || save.isPending}
				onPress={() => void submit()}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	step: { gap: space.md },
	label: { fontFamily: fontFamily.textBold }
})
