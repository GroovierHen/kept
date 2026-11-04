import { StyleSheet, View } from 'react-native'
import { REPORT_ANSWERS, reportQuestionWording, type PromiseMoment } from '@kept/contract'
import { copy } from '@/copy'
import { useSubmitReport } from '@/hooks/use-check-in'
import { errorMessage } from '@/lib/api'
import { space } from '@/lib/theme'
import { ChoiceTiles } from '../ui/choice-tiles'
import { Text } from '../ui/text'
import { StepHeading } from './step-heading'

const ANSWER_CHOICES = REPORT_ANSWERS.map((answer) => ({
	value: answer,
	label: copy.report.answers[answer],
	detail: copy.report.details[answer]
}))

/** Did you keep it? One tap saves the Report; a retry of the same tap saves once. */
export function ReportStep({
	promiseId,
	wording,
	moment,
	when
}: {
	promiseId: string
	wording: string
	moment: PromiseMoment | null
	when: 'today' | 'yesterday'
}) {
	const report = useSubmitReport({ promiseId })
	return (
		<View style={styles.step}>
			<StepHeading
				eyebrow={moment == null ? undefined : copy.report.when(when, copy.promise.moments[moment])}
				title={copy.report.question(when, reportQuestionWording(wording))}
				lead={copy.report.lead}
			/>
			<ChoiceTiles
				label={copy.report.question(when, reportQuestionWording(wording))}
				choices={ANSWER_CHOICES}
				value={report.variables ?? null}
				onChange={(answer) => report.mutate(answer)}
				disabled={report.isPending || report.isSuccess}
			/>
			{report.isError && (
				<Text tone="danger" accessibilityRole="alert">
					{errorMessage(report.error)}
				</Text>
			)}
			<Text variant="small" tone="muted">
				{copy.report.note}
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({ step: { gap: space.md } })
