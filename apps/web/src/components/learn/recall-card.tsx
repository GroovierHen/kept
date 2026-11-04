'use client'

import { useActionState, useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { MAX_RECALL_ANSWER_LENGTH, MAX_RECALL_SCORE } from '@kept/contract'
import { Button } from '@/components/ui/button'
import { ChoiceGroup } from '@/components/ui/choice-group'
import { ArrowRightIcon } from '@/components/ui/icons'
import { Textarea } from '@/components/ui/textarea'
import { SETUP_BUTTON, SETUP_CHOICE, SETUP_FIELD } from '@/components/setup/setup-styles'
import { StepTitle } from '@/components/today/step-title'
import { cn } from '@/lib/cn'
import type { DueReview } from '@/lib/learn/plan'
import { answerRecall, type RecallState } from '@/server/actions/learn'

const MAX_ANSWER_LENGTH = MAX_RECALL_ANSWER_LENGTH
const MAX_SCORE = MAX_RECALL_SCORE
const TYPING: RecallState = { kind: 'typing', error: null }

// The learn card's recall mode (#32): a key idea's question, then its mark,
// the reason and the model answer. When the AI can't mark, the same question
// comes back as multiple choice. Continue moves on to whatever is next today.
// It fills the Today screen's main column.
export function RecallCard({ review }: { review: DueReview }) {
	const t = useTranslations('Learn.recall')
	const tToday = useTranslations('TodayPage.learn')
	const id = useId()
	const router = useRouter()
	const [state, formAction, pending] = useActionState(answerRecall, TYPING)
	const [choice, setChoice] = useState<string | null>(null)
	const [isOffline, setIsOffline] = useState(false)
	// Moving on reloads today's screen; until it arrives, the button says so.
	const [isMovingOn, startMovingOn] = useTransition()

	const heading = (
		<>
			<StepTitle eyebrow={t('eyebrow', { title: review.title })}>{review.question}</StepTitle>
			<p className="text-text-muted max-w-[52ch] text-[17px] leading-[1.55]">
				{tToday('recallLead')}
			</p>
		</>
	)

	if (state.kind === 'graded') {
		const { grade } = state
		return (
			<>
				{heading}
				<div className="border-border bg-surface mt-8 overflow-hidden rounded-3xl border">
					<div className="border-border flex items-center gap-[18px] border-b px-6 py-5">
						<span aria-hidden className="flex gap-1.5">
							{Array.from({ length: MAX_SCORE }, (_, index) => (
								<span
									key={index}
									className={cn(
										'border-accent size-[22px] rounded-full border-2',
										index < grade.score && 'bg-accent'
									)}
								/>
							))}
						</span>
						<p className="face-display text-[30px] font-extrabold" role="status">
							{t('score', { score: grade.score })}
						</p>
					</div>
					<div className="flex flex-col gap-3.5 px-6 pt-5 pb-6">
						<p className="text-[16px] leading-normal">
							{grade.isMultipleChoice
								? t(grade.score > 0 ? 'choiceRight' : 'choiceWrong')
								: grade.reason}
						</p>
						<div className="bg-accent-soft rounded-2xl px-[18px] py-4">
							<h3 className="text-accent text-[13px] font-semibold">{t('modelAnswer')}</h3>
							<p className="mt-1.5 text-[16px] leading-normal">{grade.modelAnswer}</p>
						</div>
					</div>
				</div>
				<Button
					type="button"
					disabled={isMovingOn}
					className={cn(SETUP_BUTTON, 'mt-5')}
					onClick={() => startMovingOn(() => router.refresh())}
				>
					{isMovingOn ? t('loading') : t('continue')}
					{!isMovingOn && <ArrowRightIcon size={18} />}
				</Button>
			</>
		)
	}

	const isChoosing = state.kind === 'choosing'
	const error = isOffline ? t('errors.offline') : state.error
	const errorId = `${id}-error`

	return (
		<>
			{heading}
			<form
				action={formAction}
				onSubmit={(event) => {
					setIsOffline(!navigator.onLine)
					if (!navigator.onLine) event.preventDefault()
				}}
				className="mt-8 flex flex-col gap-4"
				noValidate
			>
				<input type="hidden" name="keyIdeaId" value={review.keyIdeaId} />
				<input type="hidden" name="mode" value={isChoosing ? 'choice' : 'typed'} />
				{isChoosing ? (
					<>
						<p className="text-text-muted text-[15px]">{t('choosingHint')}</p>
						<ChoiceGroup
							label={review.question}
							layout="stack"
							itemClassName={SETUP_CHOICE}
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
						rows={4}
						className={SETUP_FIELD}
					/>
				)}
				<p id={errorId} role="alert" className="text-danger text-[15px] empty:hidden">
					{error}
				</p>
				<Button
					type="submit"
					disabled={pending || (isChoosing && choice == null)}
					className={SETUP_BUTTON}
				>
					{pending ? t('marking') : t('submit')}
					{!pending && <ArrowRightIcon size={18} />}
				</Button>
			</form>
		</>
	)
}
