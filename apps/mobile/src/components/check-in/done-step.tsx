import { StyleSheet, View } from 'react-native'
import type { CheckInView, TodayResponse } from '@kept/contract'
import { copy } from '@/copy'
import { useChangePromise } from '@/hooks/use-check-in'
import { errorMessage } from '@/lib/api'
import { colors, fontFamily, space } from '@/lib/theme'
import { Text } from '../ui/text'
import { ChangePanel } from './change-panel'
import { LessonCard } from './lesson-step'
import { PromisePicker } from './promise-picker'
import { StepHeading } from './step-heading'

type Done = Extract<CheckInView, { step: 'done' }>

/**
 * Done for today: today's new Promise can still change until 4am. A Comeback
 * is marked here, as a return rather than a slip (ADR 0004).
 */
export function DoneStep({ view, streak }: { view: Done; streak: TodayResponse['streak'] }) {
	return (
		<View style={styles.step}>
			<View style={styles.badge} accessibilityElementsHidden>
				<Text variant="title" style={styles.check}>
					✓
				</Text>
			</View>
			<StepHeading title={copy.done.title} lead={copy.done.nextCheckIn} />
			{streak.comebackToday != null && (
				<Text style={styles.comeback}>{copy.done.comeback[streak.comebackToday](streak.days)}</Text>
			)}
			{view.change != null && (
				<ChangePanel summary={copy.done.change.summary} hint={copy.done.change.hint}>
					<ChangePromise change={view.change} />
				</ChangePanel>
			)}
			{view.learned != null && <LessonCard lesson={view.learned} eyebrow={copy.lesson.learned} />}
		</View>
	)
}

function ChangePromise({ change }: { change: NonNullable<Done['change']> }) {
	const save = useChangePromise({ promiseId: change.promiseId })
	return (
		<PromisePicker
			actions={change.actions}
			initial={change.initial}
			submitLabel={copy.done.change.submit}
			onSubmit={(choice) => save.mutate(choice)}
			isPending={save.isPending}
			error={save.isError ? errorMessage(save.error) : null}
		/>
	)
}

const BADGE = 72

const styles = StyleSheet.create({
	step: { gap: space.md },
	badge: {
		width: BADGE,
		height: BADGE,
		borderRadius: BADGE / 2,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.coral,
		marginTop: space.md
	},
	check: { color: colors.accent },
	comeback: { fontFamily: fontFamily.textBold }
})
