import { getTranslations } from 'next-intl/server'
import { StepCard } from '@/components/ui/step-card'
import type { Lesson } from '@/lib/learn/plan'

// Today's key idea, from getTodaysLesson. `step` teaches it inside setup or the
// Today screen; `summary` is the one line on the done-for-today screen. The
// recall question and its mark join in #32. Act puts its own Continue in `footer`.
export async function LearnCard({
	lesson,
	mode,
	footer
}: {
	lesson: Lesson
	mode: 'step' | 'summary'
	footer?: React.ReactNode
}) {
	const t = await getTranslations('Learn.card')

	return (
		<StepCard
			eyebrow={t('eyebrow')}
			title={lesson.title}
			status={mode === 'summary' ? 'done' : 'active'}
			summary={t('learned')}
		>
			<p className="text-body">{lesson.lesson}</p>
			{footer}
		</StepCard>
	)
}
