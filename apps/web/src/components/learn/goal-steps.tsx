import { getTranslations } from 'next-intl/server'
import {
	AsideCard,
	AsideSteps,
	SetupAside,
	SetupMain,
	StepIntro
} from '@/components/setup/setup-layout'
import { cn } from '@/lib/cn'
import { nextGoalQuestion, type GoalAnswers } from '@/lib/learn/goal'
import { GOAL_QUESTIONS, type GoalQuestion } from '@/lib/learn/goal-questions'
import { SETUP_STEPS } from '@/lib/setup-step'
import { getGoal } from '@/server/learn/learn'
import { GoalQuestionForm } from './goal-question-form'

const TITLE_ID = 'goal-question'

// Setup's goal step (#29): the first question still unanswered, one at a
// time. Nothing once all four are answered, by which point getPlanStatus is
// goal_saved and setup has moved on to the plan.
export async function GoalSteps({ userId }: { userId: string }) {
	const goal = await getGoal(userId)
	const question = nextGoalQuestion(goal)
	if (question == null) return null
	const [t, tSetup] = await Promise.all([
		getTranslations('Learn.goal'),
		getTranslations('SetupPage')
	])
	const index = GOAL_QUESTIONS.indexOf(question)

	return (
		<>
			<SetupMain>
				<StepIntro
					titleId={TITLE_ID}
					progress={{ current: index, total: GOAL_QUESTIONS.length }}
					eyebrow={`${t('progress', { current: index + 1, total: GOAL_QUESTIONS.length })} · ${tSetup(
						'progress',
						{ current: SETUP_STEPS.indexOf('goal') + 1, total: SETUP_STEPS.length }
					)}`}
					title={t(`questions.${question}`)}
				/>
				{/* Keyed so each question starts with an empty form. */}
				<GoalQuestionForm key={question} question={question} />
			</SetupMain>
			<GoalDraftAside goal={goal} current={question} />
		</>
	)
}

// The answers so far, filling in a draft of the plan as each one is saved.
export async function GoalDraftAside({
	goal,
	current
}: {
	goal: GoalAnswers | null
	current: GoalQuestion | null
}) {
	const [t, tGoal, tWait] = await Promise.all([
		getTranslations('SetupPage.draft'),
		getTranslations('Learn.goal'),
		getTranslations('Learn.plan.wait')
	])
	const answerOf = (question: GoalQuestion) => {
		const value = goal?.[question]
		if (value == null || value === '') return null
		return question === 'weeks' ? tGoal('weeksOption', { weeks: value }) : String(value)
	}
	const answered = GOAL_QUESTIONS.filter((question) => answerOf(question) != null).length
	const goalText = goal?.text?.replace(/[\s.!?]+$/, '')

	return (
		<SetupAside label={t('label')} lead={t('lead')}>
			<AsideCard>
				<div className="mb-2 flex items-center justify-between gap-3">
					<p className="face-display text-[20px] font-bold">{t('title')}</p>
					<span className="bg-coral-soft rounded-full px-2.5 py-1 text-[12px] font-semibold">
						{t('answered', { count: answered, total: GOAL_QUESTIONS.length })}
					</span>
				</div>
				<dl className="flex flex-col">
					{GOAL_QUESTIONS.map((question, rowIndex) => {
						const answer = answerOf(question)
						return (
							<div
								key={question}
								className="border-surface-hover flex flex-col gap-1.5 border-t py-3.5"
							>
								<dt className="text-text-faint flex items-center gap-2 text-[11px] font-semibold tracking-[0.08em] uppercase">
									{t(`labels.${question}`)}
									{question === current && (
										<span className="bg-accent text-accent-ink rounded-full px-[7px] py-0.5 text-[11px] tracking-normal normal-case">
											{t('answering')}
										</span>
									)}
								</dt>
								{answer == null ? (
									<dd className="flex flex-col gap-1.5">
										<span
											aria-hidden
											className={cn(
												'bg-surface-hover h-2.5 rounded-md',
												rowIndex % 2 === 0 ? 'w-[86%]' : 'w-[62%]'
											)}
										/>
										<span aria-hidden className="bg-surface-hover h-2.5 w-[48%] rounded-md" />
										<span className="sr-only">{t('empty')}</span>
									</dd>
								) : (
									<dd className="text-[16px] leading-[1.35] font-semibold">{answer}</dd>
								)}
							</div>
						)
					})}
				</dl>
			</AsideCard>
			<AsideSteps
				heading={t('daily')}
				items={[
					...(goalText == null || goalText === '' ? [] : [tWait('promise', { goal: goalText })]),
					tWait('report'),
					tWait('adapt')
				]}
			/>
		</SetupAside>
	)
}
