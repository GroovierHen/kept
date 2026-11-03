'use client'

import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon } from '@/components/ui/icons'
import { SETUP_BUTTON } from '@/components/setup/setup-styles'

export function LearnedButton() {
	const t = useTranslations('Learn.card')
	const { pending } = useFormStatus()
	return (
		<Button type="submit" disabled={pending} className={SETUP_BUTTON}>
			{pending ? t('saving') : t('continue')}
			{!pending && <ArrowRightIcon size={18} />}
		</Button>
	)
}
