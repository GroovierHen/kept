import { getTranslations } from 'next-intl/server'
import { StepCard } from '@/components/ui/step-card'
import { SETUP_STEPS } from '@/lib/setup-step'
import { readReminderDetails } from '@/server/setup/reminder-details'
import { ReminderForm } from './reminder-form'

// Setup's last step (#14): one repeating calendar event, added once.
export async function ReminderStep({ userId }: { userId: string }) {
	const [details, t] = await Promise.all([
		readReminderDetails(userId),
		getTranslations('SetupPage')
	])
	if (details == null) return null

	return (
		<StepCard
			eyebrow={t('progress', {
				current: SETUP_STEPS.indexOf('reminder') + 1,
				total: SETUP_STEPS.length
			})}
			title={t('steps.reminder')}
		>
			<ReminderForm details={details} />
		</StepCard>
	)
}
