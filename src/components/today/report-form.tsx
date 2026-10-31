'use client'

import { useActionState, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { REPORT_ANSWERS } from '@/lib/report'
import { submitReport, type ReportFormState } from '@/server/actions/today'

const INITIAL_STATE: ReportFormState = { error: null }

export function ReportForm({ promiseId, reportId }: { promiseId: string; reportId: string }) {
	const t = useTranslations('TodayPage.report')
	const [state, formAction, pending] = useActionState(submitReport, INITIAL_STATE)
	const [isOffline, setIsOffline] = useState(false)
	const error = isOffline ? t('errors.offline') : state.error

	return (
		<form
			action={formAction}
			onSubmit={(event) => {
				setIsOffline(!navigator.onLine)
				if (!navigator.onLine) event.preventDefault()
			}}
			className="flex flex-col gap-3"
		>
			<input type="hidden" name="promiseId" value={promiseId} />
			<input type="hidden" name="reportId" value={reportId} />
			<div className="grid grid-cols-3 gap-2">
				{REPORT_ANSWERS.map((answer) => (
					<Button
						key={answer}
						type="submit"
						name="answer"
						value={answer}
						variant="outline"
						size="lg"
						disabled={pending}
						className="text-body h-12"
					>
						{t(`answers.${answer}`)}
					</Button>
				))}
			</div>
			<p role="alert" className="text-body text-danger empty:hidden">
				{error}
			</p>
		</form>
	)
}
