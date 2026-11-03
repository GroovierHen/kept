import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { redirect } from '@/i18n/routing'
import { GoalSteps } from '@/components/learn/goal-steps'
import { KeyIdeaStep } from '@/components/learn/key-idea-step'
import { PlanStep } from '@/components/learn/plan-step'
import { PromiseStep } from '@/components/setup/promise-step'
import { ReminderStep } from '@/components/setup/reminder-step'
import { SetupShell } from '@/components/setup/setup-shell'
import { SAVE_FAILED_PARAM } from '@/lib/setup-step'
import { getSignedInUser } from '@/server/auth/session'
import { readSetupStep } from '@/server/setup/progress'

// Building a plan can take two AI attempts, each with up to 2 network tries of
// 45s; the usual case is about 10s. Server actions on this page share it, and
// PLAN_BUILD_LIMIT_SECONDS (src/lib/learn/plan-build.ts) must match it.
export const maxDuration = 200

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('SetupPage.meta')
	return { title: t('title'), robots: { index: false, follow: false } }
}

// One screen at a time, always the first unfinished one, so a user who leaves
// comes back to where they stopped. Each step renders its own h1, main column
// and side panel inside the shell.
export default async function SetupPage({ searchParams }: PageProps<'/[locale]/setup'>) {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })

	const step = await readSetupStep(user.id)
	if (step == null) return redirect({ href: '/today', locale })

	const hasSaveFailed = (await searchParams)[SAVE_FAILED_PARAM] != null

	return (
		<SetupShell step={step}>
			{step === 'goal' ? (
				<GoalSteps userId={user.id} />
			) : step === 'plan' ? (
				<PlanStep userId={user.id} hasSaveFailed={hasSaveFailed} />
			) : step === 'keyIdea' ? (
				<KeyIdeaStep userId={user.id} hasSaveFailed={hasSaveFailed} />
			) : step === 'promise' ? (
				<PromiseStep userId={user.id} />
			) : (
				<ReminderStep userId={user.id} />
			)}
		</SetupShell>
	)
}
