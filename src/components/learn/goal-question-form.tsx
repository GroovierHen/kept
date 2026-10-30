'use client'

import { useActionState, useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ChoiceGroup } from '@/components/ui/choice-group'
import { Textarea } from '@/components/ui/textarea'
import { MAX_GOAL_ANSWER_LENGTH, PLAN_WEEKS, type GoalQuestion } from '@/lib/learn/goal-questions'
import { saveGoalAnswer, type GoalFormState } from '@/server/actions/goal'

const INITIAL_STATE: GoalFormState = { error: null, answer: '' }

// One goal question. On an error the action hands back what was typed, so
// nothing is lost; offline, the submit is stopped before it can fail.
export function GoalQuestionForm({ question }: { question: GoalQuestion }) {
	const t = useTranslations('Learn.goal')
	const id = useId()
	const [state, formAction, pending] = useActionState(saveGoalAnswer, INITIAL_STATE)
	const [weeks, setWeeks] = useState<string | null>(null)
	const [isOffline, setIsOffline] = useState(false)
	const error = isOffline ? t('errors.offline') : state.error
	const errorId = `${id}-error`
	const hintId = `${id}-hint`

	return (
		<form
			action={formAction}
			onSubmit={(event) => {
				setIsOffline(!navigator.onLine)
				if (!navigator.onLine) event.preventDefault()
			}}
			className="flex flex-col gap-4"
			noValidate
		>
			<input type="hidden" name="question" value={question} />
			<p id={hintId} className="text-small text-text-muted">
				{t(`hints.${question}`)}
			</p>

			{question === 'weeks' ? (
				<>
					<ChoiceGroup
						label={t('questions.weeks')}
						choices={PLAN_WEEKS.map((value) => ({
							value: String(value),
							label: t('weeksOption', { weeks: value })
						}))}
						value={weeks}
						onChange={setWeeks}
					/>
					<input type="hidden" name="answer" value={weeks ?? ''} />
				</>
			) : (
				<Textarea
					id={`${id}-answer`}
					name="answer"
					aria-label={t(`questions.${question}`)}
					aria-describedby={error == null ? hintId : `${hintId} ${errorId}`}
					aria-invalid={error == null ? undefined : true}
					placeholder={t(`placeholders.${question}`)}
					defaultValue={state.answer}
					maxLength={MAX_GOAL_ANSWER_LENGTH}
					required
					rows={3}
					className="text-body"
				/>
			)}

			<p id={errorId} role="alert" className="text-body text-danger empty:hidden">
				{error}
			</p>

			<Button
				type="submit"
				size="lg"
				disabled={pending || (question === 'weeks' && weeks == null)}
				className="text-body h-12 w-full"
			>
				{pending ? t('saving') : t('continue')}
			</Button>
		</form>
	)
}
