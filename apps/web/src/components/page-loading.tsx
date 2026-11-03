import { getTranslations } from 'next-intl/server'
import { SiteNav } from '@/components/landing/site-nav'
import { TallyMark } from '@/components/ui/tally-mark'

// What a signed-in page shows while its data loads: the tally and its line,
// centred in the window under the site's bar.
export async function PageLoading() {
	const t = await getTranslations('Loading')

	return (
		<div className="flex min-h-svh flex-col">
			<SiteNav />
			<main className="flex flex-1 flex-col items-center justify-center px-(--page-margin) pb-24">
				<div role="status" className="page-loading flex flex-col items-center gap-6 text-center">
					<TallyMark className="h-24 w-24 sm:h-32 sm:w-32" />
					<p className="text-lead font-medium tracking-[-0.02em]">{t('label')}</p>
				</div>
			</main>
		</div>
	)
}
