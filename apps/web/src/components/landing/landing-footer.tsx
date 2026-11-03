import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { Wordmark } from '@/components/brand/wordmark'
import { navLink } from './landing-nav'

// The wordmark and its line, the links, the note on what Kept is not, and
// then the name again at full width, cut off at its foot, sliding in from the
// left as it comes into view.
export async function LandingFooter() {
	const t = await getTranslations('HomePage.footer')
	const nav = await getTranslations('HomePage.nav')
	const anchors = [
		{ href: '#how', label: nav('how') },
		{ href: '#plan', label: nav('plan') },
		{ href: '#questions', label: nav('questions') }
	]

	return (
		<footer className="border-border border-t">
			<div className="text-text-faint mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6 px-(--page-margin) pt-10 pb-6 text-[14px]">
				<p className="flex flex-wrap items-center gap-x-4 gap-y-2">
					<Wordmark size="sm" />
					<span>{t('tagline')}</span>
				</p>
				<nav aria-label={t('linksLabel')}>
					<ul className="flex flex-wrap gap-5">
						<li>
							<Link href="/sign-in" className={navLink}>
								{nav('signIn')}
							</Link>
						</li>
						<li>
							<Link href="/results" className={navLink}>
								{nav('results')}
							</Link>
						</li>
						{anchors.map((anchor) => (
							<li key={anchor.href}>
								<a href={anchor.href} className={navLink}>
									{anchor.label}
								</a>
							</li>
						))}
					</ul>
				</nav>
				<p className="w-full max-w-[60ch]">{t('legal')}</p>
			</div>
			<div
				aria-hidden
				className="face-display text-border mx-auto h-[0.62em] max-w-[1200px] overflow-hidden px-(--page-margin) text-[clamp(120px,24vw,340px)] leading-[0.8] font-extrabold tracking-[-0.06em] select-none"
			>
				<p className="slide-on-view">Kept.</p>
			</div>
		</footer>
	)
}
