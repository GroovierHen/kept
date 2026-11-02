import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { redirect } from '@/i18n/routing'
import { AuthForm } from '@/components/auth/auth-form'
import { AuthShell } from '@/components/auth/auth-shell'
import { PromiseFragment } from '@/components/landing/fragments'
import ledgerCover from '../../../../public/landing/account-book-ledger.jpg'
import { signUp } from '@/server/actions/auth'
import { getSignedInUser } from '@/server/auth/session'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('SignUpPage.meta')
	return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function SignUpPage() {
	if ((await getSignedInUser()) != null)
		return redirect({ href: '/today', locale: await getLocale() })

	const [t, about] = await Promise.all([
		getTranslations('SignUpPage'),
		getTranslations('HomePage.about')
	])

	return (
		<>
			<AuthShell
				heading={t('heading')}
				support={t('support')}
				form={
					<AuthForm
						action={signUp}
						mode="sign-up"
						defaultEmail=""
						submitLabel={t('submit')}
						pendingLabel={t('pending')}
					/>
				}
				note={<p>{t('results')}</p>}
				switchText={t('switch')}
				switchLink={t('switchLink')}
				switchHref="/sign-in"
				picture={{
					src: ledgerCover,
					alt: about('imageAlt'),
					position: 'object-[50%_45%] scale-[1.8]'
				}}
				fragment={<PromiseFragment />}
			/>
		</>
	)
}
