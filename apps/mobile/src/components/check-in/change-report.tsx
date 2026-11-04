import { REPORT_ANSWERS, reportQuestionWording, type ChangeableReport } from '@kept/contract'
import { copy } from '@/copy'
import { useSubmitReport } from '@/hooks/use-check-in'
import { errorMessage } from '@/lib/api'
import { ChoiceTiles } from '../ui/choice-tiles'
import { Text } from '../ui/text'
import { ChangePanel } from './change-panel'

const ANSWER_CHOICES = REPORT_ANSWERS.map((answer) => ({
	value: answer,
	label: copy.report.answers[answer]
}))

/** Today's Report, changeable until 4am. The latest answer counts. */
export function ChangeReport({ report }: { report: ChangeableReport }) {
	const question = copy.report.question(report.when, reportQuestionWording(report.wording))
	return (
		<ChangePanel
			summary={copy.report.change.summary(copy.report.answers[report.answer])}
			hint={copy.report.change.hint}
		>
			<Text>{question}</Text>
			{/* Keyed so each saved change gets a new report id. */}
			<ReportAgain key={report.answer} promiseId={report.promiseId} question={question} />
		</ChangePanel>
	)
}

function ReportAgain({ promiseId, question }: { promiseId: string; question: string }) {
	const report = useSubmitReport({ promiseId })
	return (
		<>
			<ChoiceTiles
				label={question}
				direction="row"
				choices={ANSWER_CHOICES}
				value={report.variables ?? null}
				onChange={(answer) => report.mutate(answer)}
				disabled={report.isPending}
			/>
			{report.isError && (
				<Text tone="danger" accessibilityRole="alert">
					{errorMessage(report.error)}
				</Text>
			)}
		</>
	)
}
