import { randomUUID } from 'node:crypto'
import { getTranslations } from 'next-intl/server'
import type { KeptDay } from '@/lib/kept-day'
import { reportQuestionWording, type ReportAnswer } from '@/lib/report'
import { ChangePanel } from './change-panel'
import { ReportForm } from './report-form'

export async function ChangeReport({
	report,
	today
}: {
	report: {
		readonly id: string
		readonly promiseDay: KeptDay
		readonly wording: string
		readonly latestAnswer: ReportAnswer
	}
	today: KeptDay
}) {
	const t = await getTranslations('TodayPage')
	const reportId = randomUUID()
	const when = report.promiseDay === today ? 'today' : 'yesterday'

	// Keyed so a saved change closes the panel.
	return (
		<ChangePanel
			key={reportId}
			summary={t('changeReport.summary', { answer: t(`report.answers.${report.latestAnswer}`) })}
			hint={t('changeReport.hint')}
		>
			<p className="text-body font-medium">
				{t(`report.question.${when}`, { wording: reportQuestionWording(report.wording) })}
			</p>
			<ReportForm promiseId={report.id} reportId={reportId} />
		</ChangePanel>
	)
}
