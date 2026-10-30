import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { redirect } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { SiteNav } from '@/components/landing/site-nav'
import { signOut } from '@/server/actions/auth'
import { getSignedInUser } from '@/server/auth/session'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('TodayPage.meta')
	return { title: t('title'), robots: { index: false, follow: false } }
}

// Where sign-up and sign-in land. A placeholder until the Today screen is
// built: it proves the session works and gives the person a way out.
export default async function TodayPage() {
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale: await getLocale() })

	const t = await getTranslations('TodayPage')

	return (
		<div className="flex min-h-svh flex-col">
			<SiteNav />
			<main className="flex flex-1 flex-col justify-center gap-6 px-(--page-margin) pb-24">
				<h1 className="text-display font-medium tracking-[-0.05em]">{t('heading')}</h1>
				<p className="text-lead max-w-[30ch]">{t('signedInAs', { email: user.email ?? '' })}</p>
				<p className="text-body max-w-[44ch]">{t('soon')}</p>
				<form action={signOut} className="mt-4">
					<Button type="submit" variant="outline" size="lg" className="text-body h-12 px-6">
						{t('signOut')}
					</Button>
				</form>
			</main>
		</div>
	)
}
