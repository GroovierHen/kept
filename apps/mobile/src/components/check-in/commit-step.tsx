import { StyleSheet, View } from 'react-native'
import type { CheckInView } from '@kept/contract'
import { copy } from '@/copy'
import { useCommitPromise } from '@/hooks/use-check-in'
import { errorMessage } from '@/lib/api'
import { space } from '@/lib/theme'
import { Text } from '../ui/text'
import { PromisePicker } from './promise-picker'
import { StepHeading } from './step-heading'

/** The next Promise. The current one comes picked, so keeping it is one tap. */
export function CommitStep({ view }: { view: Extract<CheckInView, { step: 'commit' }> }) {
	const commit = useCommitPromise()
	const lead =
		view.nudge != null ? copy.commit.nudge[view.nudge] : view.hasCurrent ? copy.commit.lead : null
	return (
		<View style={styles.step}>
			<StepHeading title={copy.commit.title} lead={lead} />
			<PromisePicker
				actions={view.picker.actions}
				initial={view.picker.initial}
				onSubmit={(choice) => commit.mutate(choice)}
				isPending={commit.isPending}
				error={commit.isError ? errorMessage(commit.error) : null}
			/>
			<Text variant="small" tone="muted" style={styles.center}>
				{copy.commit.reminder}
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({ step: { gap: space.md }, center: { textAlign: 'center' } })
