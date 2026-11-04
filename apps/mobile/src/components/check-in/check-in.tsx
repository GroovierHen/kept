import type { TodayResponse } from '@kept/contract'
import { copy } from '@/copy'
import { Text } from '../ui/text'
import { ChangeReport } from './change-report'
import { CommitStep } from './commit-step'
import { DoneStep } from './done-step'
import { LessonStep } from './lesson-step'
import { RecallStep } from './recall-step'
import { ReportStep } from './report-step'

/**
 * Today's step, the one the server's Act loop picked: report, learn (recalls
 * first, then the new idea), commit, done. Each write reads Today again, so
 * the next step comes from the server, never from a guess here.
 */
export function CheckIn({ today }: { today: TodayResponse }) {
	const { checkIn, promise } = today
	return (
		<>
			{today.unreported && <Text tone="muted">{copy.report.unreportedNote}</Text>}

			{checkIn.step === 'report' && promise != null && (
				<ReportStep
					key={checkIn.promiseId}
					promiseId={checkIn.promiseId}
					wording={promise.wording}
					moment={promise.moment}
					when={checkIn.when}
				/>
			)}
			{checkIn.step === 'learn' && checkIn.recall != null && (
				<RecallStep key={checkIn.recall.keyIdeaId} recall={checkIn.recall} />
			)}
			{checkIn.step === 'learn' && checkIn.recall == null && checkIn.lesson != null && (
				<LessonStep key={checkIn.lesson.keyIdeaId} lesson={checkIn.lesson} />
			)}
			{checkIn.step === 'commit' && <CommitStep view={checkIn} />}
			{checkIn.step === 'done' && <DoneStep view={checkIn} streak={today.streak} />}

			{today.changeableReport != null && <ChangeReport report={today.changeableReport} />}
		</>
	)
}
