import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { redirect } from '@/i18n/routing'
import { SiteNav } from '@/components/landing/site-nav'
import { GoalSteps } from '@/components/learn/goal-steps'
import { PlanStep } from '@/components/learn/plan-step'
import { PromiseStep } from '@/components/setup/promise-step'
import { ReminderStep } from '@/components/setup/reminder-step'
import { StubStep } from '@/components/setup/stub-step'
import { SAVE_FAILED_PARAM } from '@/lib/setup-step'
import { getSignedInUser } from '@/server/auth/session'
import { readSetupStep } from '@/server/setup/stub-progress'

// Building a plan can take two Gemini attempts, each with up to 3 network
// tries of 20s; the usual case is about 4s. Server actions on this page share it.
export const maxDuration = 120

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('SetupPage.meta')
	return { title: t('title'), robots: { index: false, follow: false } }
}

// One screen at a time, always the first unfinished one, so a user who leaves
// comes back to where they stopped.
export default async function SetupPage({ searchParams }: PageProps<'/[locale]/setup'>) {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })

	const step = await readSetupStep(user.id)
	if (step == null) return redirect({ href: '/today', locale })

	const t = await getTranslations('SetupPage')
	const hasSaveFailed = (await searchParams)[SAVE_FAILED_PARAM] != null

	return (
		<div className="flex min-h-svh flex-col">
			<SiteNav />
			<main className="flex flex-1 flex-col justify-center px-(--page-margin) pb-24">
				<h1 className="sr-only">{t('heading')}</h1>
				<div className="w-full max-w-xl">
					{step === 'goal' ? (
						<GoalSteps userId={user.id} />
					) : step === 'plan' ? (
						<PlanStep userId={user.id} hasSaveFailed={hasSaveFailed} />
					) : step === 'promise' ? (
						<PromiseStep userId={user.id} />
					) : step === 'reminder' ? (
						<ReminderStep userId={user.id} />
					) : (
						<StubStep step={step} hasSaveFailed={hasSaveFailed} />
					)}
				</div>
			</main>
		</div>
	)
}
