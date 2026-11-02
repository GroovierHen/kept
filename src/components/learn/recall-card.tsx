'use client'

import { useActionState, useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ChoiceGroup } from '@/components/ui/choice-group'
import { StepCard } from '@/components/ui/step-card'
import { Textarea } from '@/components/ui/textarea'
import type { DueReview } from '@/lib/learn/plan'
import { answerRecall, type RecallState } from '@/server/actions/learn'

// Must match MAX_RECALL_ANSWER_LENGTH in src/server/learn/grader.ts, which
// can't be imported here without pulling server code into the browser.
const MAX_ANSWER_LENGTH = 1000
const TYPING: RecallState = { kind: 'typing', error: null }

// The learn card's recall mode (#32): a key idea's question, then its mark,
// the reason and the model answer. When the AI can't mark, the same question
// comes back as multiple choice. Continue moves on to whatever is next today.
export function RecallCard({ review }: { review: DueReview }) {
	const t = useTranslations('Learn.recall')
	const id = useId()
	const router = useRouter()
	const [state, formAction, pending] = useActionState(answerRecall, TYPING)
	const [choice, setChoice] = useState<string | null>(null)
	const [isOffline, setIsOffline] = useState(false)
	// Moving on reloads today's screen; until it arrives, the button says so.
	const [isMovingOn, startMovingOn] = useTransition()

	if (state.kind === 'graded') {
		const { grade } = state
		return (
			<StepCard eyebrow={t('eyebrow', { title: review.title })} title={review.question}>
				<p className="text-lead font-medium" role="status">
					{t('score', { score: grade.score })}
				</p>
				<p className="text-body">
					{grade.isMultipleChoice
						? t(grade.score > 0 ? 'choiceRight' : 'choiceWrong')
						: grade.reason}
				</p>
				<div className="flex flex-col gap-1">
					<h3 className="text-small font-semibold">{t('modelAnswer')}</h3>
					<p className="text-body">{grade.modelAnswer}</p>
				</div>
				<Button
					type="button"
					size="lg"
					disabled={isMovingOn}
					className="text-body h-12 w-full"
					onClick={() => startMovingOn(() => router.refresh())}
				>
					{isMovingOn ? t('loading') : t('continue')}
				</Button>
			</StepCard>
		)
	}

	const isChoosing = state.kind === 'choosing'
	const error = isOffline ? t('errors.offline') : state.error
	const errorId = `${id}-error`

	return (
		<StepCard eyebrow={t('eyebrow', { title: review.title })} title={review.question}>
			<form
				action={formAction}
				onSubmit={(event) => {
					setIsOffline(!navigator.onLine)
					if (!navigator.onLine) event.preventDefault()
				}}
				className="flex flex-col gap-4"
				noValidate
			>
				<input type="hidden" name="keyIdeaId" value={review.keyIdeaId} />
				<input type="hidden" name="mode" value={isChoosing ? 'choice' : 'typed'} />
				{isChoosing ? (
					<>
						<p className="text-small text-text-muted">{t('choosingHint')}</p>
						<ChoiceGroup
							label={review.question}
							layout="stack"
							choices={review.choices.map((label, index) => ({ value: String(index), label }))}
							value={choice}
							onChange={setChoice}
						/>
						<input type="hidden" name="choice" value={choice ?? ''} />
					</>
				) : (
					<Textarea
						id={`${id}-answer`}
						name="answer"
						aria-label={t('answerLabel')}
						aria-describedby={error == null ? undefined : errorId}
						aria-invalid={error == null ? undefined : true}
						placeholder={t('placeholder')}
						maxLength={MAX_ANSWER_LENGTH}
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
					disabled={pending || (isChoosing && choice == null)}
					className="text-body h-12 w-full"
				>
					{pending ? t('marking') : t('submit')}
				</Button>
			</form>
		</StepCard>
	)
}
