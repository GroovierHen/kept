'use client'

import { useActionState, useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckIcon, MinusIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { REPORT_ANSWERS } from '@/lib/report'
import { submitReport, type ReportFormState } from '@/server/actions/today'

const INITIAL_STATE: ReportFormState = { error: null }

/** `tiles` is the report step's three big answers; `row` fits the change panel. */
export function ReportForm({
	promiseId,
	reportId,
	layout = 'tiles'
}: {
	promiseId: string
	reportId: string
	layout?: 'tiles' | 'row'
}) {
	const t = useTranslations('TodayPage.report')
	const id = useId()
	const [state, formAction, pending] = useActionState(submitReport, INITIAL_STATE)
	const [isOffline, setIsOffline] = useState(false)
	const error = isOffline ? t('errors.offline') : state.error
	const isTiles = layout === 'tiles'

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
			<div className={cn('grid gap-3', isTiles ? 'sm:grid-cols-3' : 'grid-cols-3 gap-2')}>
				{REPORT_ANSWERS.map((answer) => (
					// The answer alone names the button; its detail line describes it.
					<button
						key={answer}
						type="submit"
						name="answer"
						value={answer}
						disabled={pending}
						aria-describedby={isTiles ? `${id}-${answer}` : undefined}
						className={cn(
							'border-border-strong bg-surface text-text hover:border-accent focus-visible:outline-accent rounded-[20px] border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60',
							isTiles
								? 'flex min-h-[148px] flex-col items-start justify-between gap-3.5 p-[18px] text-left max-sm:min-h-0 max-sm:flex-row max-sm:items-center max-sm:justify-start'
								: 'h-12 rounded-[14px] text-[16px] font-semibold'
						)}
					>
						{isTiles ? (
							<>
								<AnswerMark answer={answer} />
								<span className="flex flex-col gap-1">
									<span className="face-display text-[28px] leading-none font-extrabold">
										{t(`answers.${answer}`)}
									</span>
									<span
										id={`${id}-${answer}`}
										aria-hidden
										className="text-text-muted text-[14px] leading-[1.4]"
									>
										{t(`details.${answer}`)}
									</span>
								</span>
							</>
						) : (
							t(`answers.${answer}`)
						)}
					</button>
				))}
			</div>
			<p role="alert" className="text-danger text-[15px] empty:hidden">
				{error}
			</p>
		</form>
	)
}

function AnswerMark({ answer }: { answer: (typeof REPORT_ANSWERS)[number] }) {
	return (
		<span
			aria-hidden
			className={cn(
				'border-accent text-accent grid size-11 flex-none place-items-center rounded-full border-2',
				answer === 'yes' && 'bg-coral',
				answer === 'partly' && 'bg-[linear-gradient(90deg,transparent_50%,var(--accent)_50%)]'
			)}
		>
			{answer === 'yes' && <CheckIcon size={22} />}
			{answer === 'no' && <MinusIcon size={22} />}
		</span>
	)
}
