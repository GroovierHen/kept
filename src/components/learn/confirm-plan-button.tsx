'use client'

import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon } from '@/components/ui/icons'
import { SETUP_BUTTON } from '@/components/setup/setup-styles'

export function ConfirmPlanButton() {
	const t = useTranslations('Learn.plan')
	const { pending } = useFormStatus()
	return (
		<Button type="submit" disabled={pending} className={SETUP_BUTTON}>
			{pending ? t('confirming') : t('confirm')}
			{!pending && <ArrowRightIcon size={18} />}
		</Button>
	)
}
