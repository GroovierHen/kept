import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { redirect } from '@/i18n/routing'
import { AuthForm } from '@/components/auth/auth-form'
import { AuthShell } from '@/components/auth/auth-shell'
import { ReportFragment } from '@/components/landing/fragments'
import accountOfHours from '../../../../public/landing/account-book-of-hours.jpg'
import { signIn } from '@/server/actions/auth'
import { getSignedInUser } from '@/server/auth/session'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('SignInPage.meta')
	return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function SignInPage() {
	if ((await getSignedInUser()) != null)
		return redirect({ href: '/today', locale: await getLocale() })

	const [t, about] = await Promise.all([
		getTranslations('SignInPage'),
		getTranslations('HomePage.about')
	])

	return (
		<>
			<AuthShell
				heading={t('heading')}
				support={t('support')}
				form={
					<AuthForm
						action={signIn}
						mode="sign-in"
						defaultEmail=""
						submitLabel={t('submit')}
						pendingLabel={t('pending')}
					/>
				}
				note={<p>{t('forgot')}</p>}
				switchText={t('switch')}
				switchLink={t('switchLink')}
				switchHref="/sign-up"
				picture={{ src: accountOfHours, alt: about('hoursAlt'), position: 'object-[50%_30%]' }}
				fragment={<ReportFragment />}
			/>
		</>
	)
}
