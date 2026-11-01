import { getTranslations } from 'next-intl/server'
import { learnFirstKeyIdea } from '@/server/actions/learn'
import { getTodaysLesson } from '@/server/learn/learn'
import { keptDayFor } from '@/server/learn/teach-lesson'
import { LearnCard } from './learn-card'
import { LearnedButton } from './learned-button'

// Setup's key idea step (#31): the plan's first key idea, taught on Day 1.
export async function KeyIdeaStep({
	userId,
	hasSaveFailed
}: {
	userId: string
	hasSaveFailed: boolean
}) {
	const [lesson, t] = await Promise.all([
		keptDayFor(userId).then((keptDay) => getTodaysLesson(userId, keptDay)),
		getTranslations('Learn.card')
	])
	// Setup only reaches this step with a confirmed plan of 5 untaught ideas.
	if (lesson == null) return null

	return (
		<LearnCard
			lesson={lesson}
			mode="step"
			footer={
				<form action={learnFirstKeyIdea} className="flex flex-col gap-3">
					<input type="hidden" name="keyIdeaId" value={lesson.keyIdeaId} />
					{hasSaveFailed && (
						<p role="alert" className="text-body text-danger">
							{t('saveFailed')}
						</p>
					)}
					<LearnedButton />
				</form>
			}
		/>
	)
}
