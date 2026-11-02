import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { linkClass } from './site-nav'

// Close and footer in one green field. The wordmark runs along the bottom as
// wide as the page allows, whole, with room under it for the p's tail.
export async function LandingFooter() {
	const t = await getTranslations('HomePage.footer')
	const nav = await getTranslations('HomePage.nav')
	const links = [
		{ href: '#how', label: nav('how') },
		{ href: '#plan', label: nav('plan') },
		{ href: '#questions', label: nav('questions') }
	]

	return (
		<footer className="bg-accent text-accent-ink relative overflow-hidden px-(--page-margin) pt-24 md:pt-36">
			<div className="grid gap-10 md:grid-cols-12 md:gap-x-(--gutter)">
				<div className="flex flex-col items-start gap-8 md:col-span-7">
					<h2 data-reveal className="text-head max-w-[14ch] font-medium tracking-[-0.05em]">
						{t('invitation')}
					</h2>
					<Button
						asChild
						size="lg"
						className="bg-accent-ink text-accent hover:bg-surface text-body h-12 w-full px-6 sm:w-auto"
					>
						<Link href="/sign-up">{t('start')}</Link>
					</Button>
				</div>
				<nav aria-label={t('linksLabel')} className="md:col-span-3 md:col-start-10">
					<ul className="text-body flex flex-wrap gap-x-6 gap-y-2 md:flex-col">
						<li>
							<Link href="/sign-in" className={linkClass}>
								{nav('signIn')}
							</Link>
						</li>
						<li>
							<Link href="/results" className={linkClass}>
								{nav('results')}
							</Link>
						</li>
						{links.map((link) => (
							<li key={link.href}>
								<a href={link.href} className={linkClass}>
									{link.label}
								</a>
							</li>
						))}
					</ul>
				</nav>
			</div>

			<div className="pt-28 md:pt-40">
				<div className="text-small flex flex-col gap-1 pb-4 md:flex-row md:justify-between md:gap-8">
					<p>{t('credit')}</p>
					<p>{t('legal')}</p>
				</div>
				<p
					aria-hidden
					className="pb-[0.08em] text-[34vw] leading-[1] font-medium tracking-[-0.07em] whitespace-nowrap select-none md:text-[28vw]"
				>
					Kept
				</p>
			</div>
		</footer>
	)
}
