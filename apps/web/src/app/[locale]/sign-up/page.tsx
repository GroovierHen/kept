import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { getLocale, getTranslations } from 'next-intl/server'
import { redirect } from '@/i18n/routing'
import { AuthForm } from '@/components/auth/auth-form'
import { AuthShell, StepBars } from '@/components/auth/auth-shell'
import { signUp } from '@/server/actions/auth'
import { getSignedInUser } from '@/server/auth/session'
import { START_EMAIL_COOKIE } from '@/server/auth/start-email'

// Account, goal, plan, first promise.
const GETTING_STARTED_STEPS = 4

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('SignUpPage.meta')
	return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function SignUpPage() {
	if ((await getSignedInUser()) != null)
		return redirect({ href: '/today', locale: await getLocale() })

	const [t, cookieStore] = await Promise.all([getTranslations('SignUpPage'), cookies()])
	const startEmail = cookieStore.get(START_EMAIL_COOKIE)?.value ?? ''

	return (
		<AuthShell
			step={<StepBars total={GETTING_STARTED_STEPS} label={t('step')} />}
			heading={t('heading')}
			support={t('support')}
			form={
				<AuthForm
					action={signUp}
					mode="sign-up"
					defaultEmail={startEmail}
					submitLabel={t('submit')}
					pendingLabel={t('pending')}
				/>
			}
			note={t('results')}
			switchText={t('switch')}
			switchLink={t('switchLink')}
			switchHref="/sign-in"
			next={{
				heading: t('next.heading'),
				steps: [t('next.goal'), t('next.plan'), t('next.promise')]
			}}
			card={
				<>
					<p className="text-text-faint flex justify-between text-[13px] font-medium">
						<span>{t('card.day')}</span>
						<span className="bg-accent-soft text-accent-deep rounded-md px-2 py-[3px] font-semibold">
							{t('card.size')}
						</span>
					</p>
					<p className="face-display mt-3.5 mb-1.5 text-[28px] leading-[1.12] font-bold">
						{t('card.sentence')}
					</p>
					<p className="text-text-faint text-[14px]">{t('card.why')}</p>
					<div className="bg-border mt-[22px] h-2 overflow-hidden rounded-lg">
						{/* Day 1 of 8 weeks. */}
						<div className="bg-accent h-full w-[12.5%] rounded-lg motion-safe:animate-[fill_1.6s_0.6s_var(--ease-out)_both]" />
					</div>
					<p className="text-text-faint mt-2 flex justify-between gap-4 text-[13px]">
						<span>{t('card.week')}</span>
						<span>{t('card.goal')}</span>
					</p>
				</>
			}
		/>
	)
}
