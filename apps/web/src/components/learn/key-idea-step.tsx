import { getTranslations } from 'next-intl/server'
import {
	AsideCard,
	AsideSteps,
	SetupAside,
	SetupMain,
	StepIntro
} from '@/components/setup/setup-layout'
import { SETUP_STEPS } from '@/lib/setup-step'
import { learnFirstKeyIdea } from '@/server/actions/learn'
import { getTodaysLesson } from '@/server/learn/learn'
import { keptDayFor } from '@/server/learn/teach-lesson'
import { LearnedButton } from './learned-button'

// Setup's key idea step (#31): the plan's first key idea, taught on Day 1.
export async function KeyIdeaStep({
	userId,
	hasSaveFailed
}: {
	userId: string
	hasSaveFailed: boolean
}) {
	const [lesson, t, tSetup] = await Promise.all([
		keptDayFor(userId).then((keptDay) => getTodaysLesson(userId, keptDay)),
		getTranslations('Learn.card'),
		getTranslations('SetupPage')
	])
	// Setup only reaches this step with a confirmed plan of 5 untaught ideas.
	if (lesson == null) return null

	return (
		<>
			<SetupMain>
				<StepIntro
					progress={{ current: SETUP_STEPS.indexOf('keyIdea'), total: SETUP_STEPS.length }}
					eyebrow={`${tSetup('progress', {
						current: SETUP_STEPS.indexOf('keyIdea') + 1,
						total: SETUP_STEPS.length
					})} · ${tSetup('steps.keyIdea')}`}
					title={lesson.title}
				/>
				<p className="max-w-[56ch] text-[19px] leading-[1.6]">{lesson.lesson}</p>
				<form action={learnFirstKeyIdea} className="mt-9 flex flex-col gap-3">
					<input type="hidden" name="keyIdeaId" value={lesson.keyIdeaId} />
					{hasSaveFailed && (
						<p role="alert" className="text-danger text-[15px]">
							{t('saveFailed')}
						</p>
					)}
					<LearnedButton />
				</form>
			</SetupMain>
			<SetupAside label={tSetup('keyIdea.label')} lead={tSetup('keyIdea.lead')}>
				<AsideCard>
					<p className="text-text-faint text-[13px] font-medium">{t('eyebrow')}</p>
					<p className="face-display mt-3 text-[26px] leading-[1.15] font-bold">{lesson.title}</p>
				</AsideCard>
				<AsideSteps
					heading={tSetup('keyIdea.nextHeading')}
					items={[
						tSetup('keyIdea.steps.read'),
						tSetup('keyIdea.steps.recall'),
						tSetup('keyIdea.steps.next')
					]}
				/>
			</SetupAside>
		</>
	)
}
