import { getTranslations } from 'next-intl/server'
import { CheckIcon } from '@/components/ui/icons'
import { StepTitle } from '@/components/today/step-title'
import type { Lesson } from '@/lib/learn/plan'

// Today's key idea, from getTodaysLesson. `step` teaches it in the Today
// screen's main column; `summary` is the one line on the done-for-today screen.
// Act puts its own Continue in `footer`.
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

	if (mode === 'summary') {
		return (
			<section className="border-border bg-surface flex items-start gap-3 rounded-[20px] border p-5">
				<span className="bg-accent text-accent-ink grid size-7 flex-none place-items-center rounded-full">
					<CheckIcon size={14} />
				</span>
				<div className="flex min-w-0 flex-col gap-0.5">
					<p className="text-text-faint text-[13px] font-medium">{t('eyebrow')}</p>
					<h2 className="text-[16px] font-semibold">{lesson.title}</h2>
					<p className="text-text-muted text-[14px]">{t('learned')}</p>
				</div>
			</section>
		)
	}

	return (
		<>
			<StepTitle eyebrow={t('eyebrow')}>{lesson.title}</StepTitle>
			<p className="max-w-[56ch] text-[19px] leading-[1.6]">{lesson.lesson}</p>
			{footer}
		</>
	)
}
