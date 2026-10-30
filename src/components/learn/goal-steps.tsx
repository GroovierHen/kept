import { getTranslations } from 'next-intl/server'
import { StepCard } from '@/components/ui/step-card'
import { nextGoalQuestion } from '@/lib/learn/goal'
import { GOAL_QUESTIONS } from '@/lib/learn/goal-questions'
import { getGoal } from '@/server/learn/learn'
import { GoalQuestionForm } from './goal-question-form'

// Setup's goal step (#29): the first question still unanswered, one at a
// time. Nothing once all four are answered, by which point getPlanStatus is
// goal_saved and setup has moved on to the plan.
export async function GoalSteps({ userId }: { userId: string }) {
	const question = nextGoalQuestion(await getGoal(userId))
	if (question == null) return null
	const t = await getTranslations('Learn.goal')

	return (
		<StepCard
			eyebrow={t('progress', {
				current: GOAL_QUESTIONS.indexOf(question) + 1,
				total: GOAL_QUESTIONS.length
			})}
			title={t(`questions.${question}`)}
		>
			{/* Keyed so each question starts with an empty form. */}
			<GoalQuestionForm key={question} question={question} />
		</StepCard>
	)
}
