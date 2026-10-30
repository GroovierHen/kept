import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

// The bar every public page opens with: the wordmark, a few plain links and
// the one action. On the home page the links jump to its sections; on the
// sign-in pages only the wordmark shows, so the form is the only thing to do.
export async function SiteNav({ sections = false }: { sections?: boolean }) {
	const t = await getTranslations('HomePage.nav')
	const anchors = [
		{ href: '#how', label: t('how') },
		{ href: '#plan', label: t('plan') },
		{ href: '#questions', label: t('questions') }
	]

	return (
		<header className="text-small flex h-16 items-center justify-between gap-6 px-(--page-margin) sm:h-20">
			<Link
				href="/"
				className="text-body rounded-sm font-medium tracking-[-0.03em] focus-visible:outline-2 focus-visible:outline-offset-4"
			>
				Kept
			</Link>
			{sections ? (
				<nav aria-label={t('label')} className="flex items-center gap-6">
					<ul className="hidden items-center gap-6 md:flex">
						{anchors.map((anchor) => (
							<li key={anchor.href}>
								<a href={anchor.href} className={linkClass}>
									{anchor.label}
								</a>
							</li>
						))}
					</ul>
					<Link href="/sign-in" className={linkClass}>
						{t('signIn')}
					</Link>
					<Button asChild size="sm" className="h-9 px-4">
						<Link href="/sign-up">{t('start')}</Link>
					</Button>
				</nav>
			) : null}
		</header>
	)
}

export const linkClass = cn(
	'rounded-sm underline decoration-transparent decoration-[0.07em] underline-offset-[0.25em]',
	'transition-[text-decoration-color] duration-200',
	'hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4'
)
