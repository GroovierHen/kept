import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { redirect } from '@/i18n/routing'
import { AuthForm } from '@/components/auth/auth-form'
import { AuthShell } from '@/components/auth/auth-shell'
import { CheckIcon } from '@/components/ui/icons'
import { signIn } from '@/server/actions/auth'
import { getSignedInUser } from '@/server/auth/session'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('SignInPage.meta')
	return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function SignInPage() {
	if ((await getSignedInUser()) != null)
		return redirect({ href: '/today', locale: await getLocale() })

	const t = await getTranslations('SignInPage')
	const option = 'border-border text-text-muted rounded-[14px] border px-4 py-3 font-medium'

	return (
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
			note={t('forgot')}
			switchText={t('switch')}
			switchLink={t('switchLink')}
			switchHref="/sign-up"
			next={{
				heading: t('next.heading'),
				steps: [t('next.report'), t('next.learn'), t('next.promise')]
			}}
			card={
				<>
					<p className="text-text-faint flex justify-between text-[13px] font-medium">
						<span>{t('card.day')}</span>
						<span className="text-text flex items-center gap-1.5 font-semibold">
							<span className="bg-coral size-2 rounded-full" />
							{t('card.streak')}
						</span>
					</p>
					<p className="face-display mt-3.5 mb-[18px] text-[26px] leading-[1.15] font-bold">
						{t('card.question')}
					</p>
					<div className="grid gap-2.5">
						<span className="bg-kept-soft border-success flex items-center justify-between rounded-[14px] border-2 px-4 py-3 font-semibold">
							{t('card.yes')}
							<CheckIcon size={20} className="text-success" />
						</span>
						<span className={option}>{t('card.partly')}</span>
						<span className={option}>{t('card.no')}</span>
					</div>
				</>
			}
		/>
	)
}
