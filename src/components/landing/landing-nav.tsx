import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/brand/wordmark'
import { lift } from '@/components/brand/lift'

// The home page's bar: the wordmark, a link to each section, then Sign in and
// the one action. It sticks to the top, and a green line along its foot
// fills as the page is read, where the browser can tie an animation to scroll.
export async function LandingNav() {
	const t = await getTranslations('HomePage.nav')
	const anchors = [
		{ href: '#how', label: t('how') },
		{ href: '#plan', label: t('plan') },
		{ href: '#ledger', label: t('ledger') },
		{ href: '#questions', label: t('questions') }
	]

	return (
		<header className="border-border bg-bg/85 sticky top-0 z-30 h-16 border-b backdrop-blur-md">
			<nav
				aria-label={t('label')}
				className="mx-auto flex h-full max-w-[1200px] items-center gap-7 px-(--page-margin)"
			>
				<a
					href="#top"
					className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
				>
					<Wordmark />
				</a>
				<ul className="hidden flex-1 gap-6 text-[15px] font-medium whitespace-nowrap lg:flex">
					{anchors.map((anchor) => (
						<li key={anchor.href}>
							<a href={anchor.href} className={navLink}>
								{anchor.label}
							</a>
						</li>
					))}
				</ul>
				<div className="ml-auto flex items-center gap-2.5">
					<Link href="/sign-in" className={`${navLink} px-3.5 py-2.5 text-[15px] font-medium`}>
						{t('signIn')}
					</Link>
					<Button
						asChild
						className={`bg-night text-night-ink hover:bg-night h-auto rounded-full px-[18px] py-[11px] text-[15px] font-semibold ${lift}`}
					>
						<Link href="/sign-up">{t('start')}</Link>
					</Button>
				</div>
			</nav>
			<div
				aria-hidden
				className="read-progress bg-accent absolute bottom-[-1px] left-0 h-[3px] w-full origin-left rounded-r-[3px]"
			/>
		</header>
	)
}

export const navLink =
	'text-text hover:text-accent rounded-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4'
