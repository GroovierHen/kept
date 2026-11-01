'use client'

import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export function LearnedButton() {
	const t = useTranslations('Learn.card')
	const { pending } = useFormStatus()
	return (
		<Button type="submit" size="lg" disabled={pending} className="text-body h-12 w-full">
			{pending ? t('saving') : t('continue')}
		</Button>
	)
}
