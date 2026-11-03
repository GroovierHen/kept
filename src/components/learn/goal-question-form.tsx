'use client'

import { useActionState, useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ChoiceGroup } from '@/components/ui/choice-group'
import { ArrowRightIcon } from '@/components/ui/icons'
import { Textarea } from '@/components/ui/textarea'
import { SETUP_BUTTON, SETUP_FIELD, SETUP_TILE } from '@/components/setup/setup-styles'
import { cn } from '@/lib/cn'
import { MAX_GOAL_ANSWER_LENGTH, PLAN_WEEKS, type GoalQuestion } from '@/lib/learn/goal-questions'
import { saveGoalAnswer, type GoalFormState } from '@/server/actions/goal'

const INITIAL_STATE: GoalFormState = { error: null, answer: '' }
const EXAMPLE_KEYS = ['first', 'second', 'third'] as const

// One goal question. On an error the action hands back what was typed, so
// nothing is lost; offline, the submit is stopped before it can fail. A
// written question offers three examples to start from, which fill the field.
export function GoalQuestionForm({
	question,
	defaultAnswer = ''
}: {
	question: GoalQuestion
	defaultAnswer?: string
}) {
	const t = useTranslations('Learn.goal')
	const id = useId()
	const [state, formAction, pending] = useActionState(saveGoalAnswer, {
		...INITIAL_STATE,
		answer: defaultAnswer
	})
	const [answer, setAnswer] = useState(state.answer)
	const [weeks, setWeeks] = useState<string | null>(null)
	const [isOffline, setIsOffline] = useState(false)
	const error = isOffline ? t('errors.offline') : state.error
	const errorId = `${id}-error`
	const hintId = `${id}-hint`
	const isEmpty = question === 'weeks' ? weeks == null : answer.trim() === ''

	return (
		<form
			action={formAction}
			onSubmit={(event) => {
				setIsOffline(!navigator.onLine)
				if (!navigator.onLine) event.preventDefault()
			}}
			className="flex flex-col"
			noValidate
		>
			<input type="hidden" name="question" value={question} />
			<p id={hintId} className="text-text-muted max-w-[52ch] text-[17px] leading-[1.55]">
				{t(`hints.${question}`)}
			</p>

			{question === 'weeks' ? (
				<>
					<ChoiceGroup
						label={t('questions.weeks')}
						className="mt-8 grid-cols-3"
						itemClassName={SETUP_TILE}
						choices={PLAN_WEEKS.map((value) => ({
							value: String(value),
							label: (
								<span className="flex h-full flex-col justify-between gap-2">
									<span className="face-display text-[52px] leading-[0.9] font-extrabold">
										{value}
									</span>{' '}
									<span className="text-[15px] font-semibold">{t('weeksUnit')}</span>
								</span>
							)
						}))}
						value={weeks}
						onChange={setWeeks}
					/>
					<input type="hidden" name="answer" value={weeks ?? ''} />
				</>
			) : (
				<>
					<div className="relative mt-8">
						<Textarea
							id={`${id}-answer`}
							name="answer"
							aria-label={t(`questions.${question}`)}
							aria-describedby={error == null ? hintId : `${hintId} ${errorId}`}
							aria-invalid={error == null ? undefined : true}
							placeholder={t(`placeholders.${question}`)}
							value={answer}
							onChange={(event) => setAnswer(event.target.value)}
							maxLength={MAX_GOAL_ANSWER_LENGTH}
							required
							rows={4}
							className={cn(SETUP_FIELD, 'min-h-[148px] resize-y pb-10')}
						/>
						<span
							aria-hidden
							className="text-text-faint absolute right-[18px] bottom-3.5 text-[12px] font-medium tabular-nums"
						>
							{t('count', { count: answer.length, max: MAX_GOAL_ANSWER_LENGTH })}
						</span>
					</div>
					<div className="mt-4 flex flex-wrap items-center gap-2">
						<span className="text-text-faint mr-1 text-[13px] font-medium">
							{t('examplesLabel')}
						</span>
						{EXAMPLE_KEYS.map((key) => {
							const example = t(`examples.${question}.${key}`)
							return (
								<button
									key={key}
									type="button"
									onClick={() => setAnswer(example)}
									className="border-border-strong bg-surface hover:border-accent hover:bg-accent-soft focus-visible:outline-accent min-h-11 rounded-full border px-4 text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
								>
									{example}
								</button>
							)
						})}
					</div>
				</>
			)}

			<p id={errorId} role="alert" className="text-danger mt-4 text-[15px] empty:hidden">
				{error}
			</p>

			<Button type="submit" disabled={pending || isEmpty} className={cn(SETUP_BUTTON, 'mt-8')}>
				{pending ? t('saving') : t('continue')}
				{!pending && <ArrowRightIcon size={18} />}
			</Button>
		</form>
	)
}
