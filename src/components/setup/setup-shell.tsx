import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { BrandTheme } from '@/components/brand/brand-theme'
import { Wordmark } from '@/components/brand/wordmark'
import { CheckIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { SETUP_STEPS, type SetupStep } from '@/lib/setup-step'

// The frame every setup screen shares: the wordmark and sign out, the five
// steps down the left on wide screens, then the step's own main column and
// green side panel as the next two items of one wrapping row, so the panel
// drops under the question on a phone.
export async function SetupShell({
	step,
	children
}: {
	step: SetupStep
	children: React.ReactNode
}) {
	const [t, tAuth] = await Promise.all([getTranslations('SetupPage'), getTranslations('Auth')])
	const current = SETUP_STEPS.indexOf(step)

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
				<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
					<p className="text-text-muted flex items-center gap-2 text-[14px]">
						<CheckIcon size={18} className="text-success" />
						{t('savesAsYouGo')}
					</p>
					<SignOutButton className="border-border-strong border" />
				</div>
			</header>

			<div className="flex flex-1 flex-wrap items-stretch gap-x-[clamp(24px,3.5vw,56px)] gap-y-8 px-[clamp(20px,4vw,48px)] pt-2 pb-[clamp(20px,4vw,48px)]">
				<nav aria-label={t('rail.label')} className="hidden flex-[0_0_240px] pt-9 lg:block">
					<p className="text-text-faint mb-[18px] text-[12px] font-semibold tracking-[0.08em] uppercase">
						{t('rail.heading')}
					</p>
					<ol className="flex flex-col gap-1.5">
						{SETUP_STEPS.map((name, index) => {
							const isDone = index < current
							const isCurrent = index === current
							return (
								<li
									key={name}
									aria-current={isCurrent ? 'step' : undefined}
									className={cn(
										'flex items-start gap-3 rounded-2xl border px-3.5 py-3',
										isCurrent ? 'border-border bg-surface' : 'border-transparent'
									)}
								>
									<span
										className={cn(
											'grid size-7 flex-none place-items-center rounded-full border-2 text-[13px] font-bold',
											isDone && 'border-accent bg-accent text-accent-ink',
											isCurrent && 'border-accent bg-coral text-coral-ink',
											!isDone && !isCurrent && 'border-border-strong text-text-faint'
										)}
									>
										{isDone ? (
											<>
												<CheckIcon size={14} />
												<span className="sr-only">{t('rail.done')}</span>
											</>
										) : (
											index + 1
										)}
									</span>
									<span className="flex min-w-0 flex-col gap-0.5">
										<span
											className={cn(
												'text-[15px] font-semibold',
												isDone || isCurrent ? 'text-text' : 'text-text-muted'
											)}
										>
											{t(`steps.${name}`)}
										</span>
										<span className="text-text-faint text-[13px] leading-[1.4]">
											{t(`rail.subs.${name}`)}
										</span>
									</span>
								</li>
							)
						})}
					</ol>
				</nav>
				{children}
			</div>
		</BrandTheme>
	)
}
