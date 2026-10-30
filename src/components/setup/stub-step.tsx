import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { StepCard } from '@/components/ui/step-card'
import { SETUP_STEPS, type SetupStep } from '@/lib/setup-step'
import { continueSetup } from '@/server/actions/setup'

// TEMPORARY: stands in for a step until its real piece lands: <GoalSteps> (#29),
// <PlanStep> (#30), <LearnCard> (#31), the promise picker (#13), the reminder (#14).
export async function StubStep({ step }: { step: SetupStep }) {
	const t = await getTranslations('SetupPage')

	return (
		<StepCard
			eyebrow={t('progress', { current: SETUP_STEPS.indexOf(step) + 1, total: SETUP_STEPS.length })}
			title={t(`steps.${step}`)}
		>
			<p className="text-body text-text-muted">{t('stub')}</p>
			<form action={continueSetup}>
				<input type="hidden" name="step" value={step} />
				<Button type="submit" size="lg" className="text-body h-12 w-full">
					{t('continue')}
				</Button>
			</form>
		</StepCard>
	)
}
