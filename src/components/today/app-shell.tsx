import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { BrandTheme } from '@/components/brand/brand-theme'
import { Wordmark } from '@/components/brand/wordmark'
import { cn } from '@/lib/cn'
import { signOut } from '@/server/actions/auth'

const PAGES = [
	{ name: 'today', href: '/today' },
	{ name: 'ledger', href: '/ledger' }
] as const

// The frame of the signed-in screens once setup is done: the wordmark, a tab
// for each screen and sign out, then the screen's own row, laid out like the
// setup steps so a side panel drops under the main column on a phone.
export async function AppShell({
	current,
	children
}: {
	current: (typeof PAGES)[number]['name']
	children: React.ReactNode
}) {
	const [t, tAuth] = await Promise.all([getTranslations('AppShell'), getTranslations('Auth')])

	return (
		<BrandTheme className="flex flex-col">
			<header className="flex flex-wrap items-center justify-between gap-4 px-[clamp(20px,4vw,48px)] py-5">
				<Link
					href="/"
					aria-label={tAuth('home')}
					className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
				>
					<Wordmark size="sm" />
				</Link>
				<nav aria-label={t('nav')} className="flex items-center gap-1.5">
					{PAGES.map(({ name, href }) => (
						<Link
							key={name}
							href={href}
							aria-current={name === current ? 'page' : undefined}
							className={cn(
								'flex min-h-11 items-center rounded-full px-4 text-[15px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2',
								name === current ? 'bg-accent text-accent-ink' : 'text-text hover:bg-surface-hover'
							)}
						>
							{t(name)}
						</Link>
					))}
					<form action={signOut}>
						<button
							type="submit"
							className="text-text-muted hover:text-text min-h-11 rounded-full px-3 text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
						>
							{t('signOut')}
						</button>
					</form>
				</nav>
			</header>

			<div className="flex flex-1 flex-wrap items-start gap-x-[clamp(24px,3.5vw,56px)] gap-y-8 px-[clamp(20px,4vw,48px)] pt-2 pb-[clamp(20px,4vw,48px)]">
				{children}
			</div>
		</BrandTheme>
	)
}
