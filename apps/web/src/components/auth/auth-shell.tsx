import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { LockIcon } from '@/components/ui/icons'
import { BrandTheme } from '@/components/brand/brand-theme'
import { Wordmark } from '@/components/brand/wordmark'
import { cn } from '@/lib/cn'

// The frame both sign-in pages share: the form on the left, and on wide
// screens a green panel on the right saying what comes next, with the piece
// of Kept the person is about to use floating on it.
export async function AuthShell({
	step,
	heading,
	support,
	form,
	note,
	switchText,
	switchLink,
	switchHref,
	next,
	card
}: {
	step?: React.ReactNode
	heading: string
	support: string
	form: React.ReactNode
	note: string
	switchText: string
	switchLink: string
	switchHref: '/sign-in' | '/sign-up'
	next: { heading: string; steps: readonly string[] }
	card: React.ReactNode
}) {
	const t = await getTranslations('Auth')

	return (
		<BrandTheme className="flex flex-wrap">
			<main className="flex min-w-0 flex-[1_1_480px] flex-col px-[clamp(24px,5vw,72px)] py-8">
				<Link
					href="/"
					aria-label={t('home')}
					className="self-start rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
				>
					<Wordmark />
				</Link>

				<div className="mx-auto my-10 flex w-full max-w-[460px] flex-1 flex-col justify-center">
					{step}
					<h1
						data-reveal
						className="face-display mt-5 mb-3.5 text-[clamp(40px,4.4vw,56px)] leading-none font-extrabold delay-[80ms]"
					>
						{heading}
					</h1>
					<p data-reveal className="text-text-muted text-[17px] leading-[1.55] delay-[160ms]">
						{support}
					</p>
					<div className="mt-8">{form}</div>
					<p
						data-reveal
						className="bg-surface border-border text-text-muted mt-[22px] flex items-start gap-3 rounded-[14px] border px-4 py-3.5 text-[14px] leading-normal delay-[320ms]"
					>
						<LockIcon size={20} className="text-accent mt-px flex-none" />
						{note}
					</p>
					<p data-reveal className="text-text-muted mt-6 text-[15px] delay-[400ms]">
						{switchText}{' '}
						<Link
							href={switchHref}
							className="text-accent hover:text-accent-deep rounded-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
						>
							{switchLink}
						</Link>
					</p>
				</div>
			</main>

			<aside className="bg-accent text-accent-ink relative hidden min-w-0 flex-[1_1_520px] flex-col justify-center overflow-hidden px-[clamp(32px,5vw,80px)] py-16 md:flex">
				<div aria-hidden className="dot-grid absolute inset-0" />
				<div
					aria-hidden
					className="border-coral absolute -top-40 -right-40 size-[480px] rounded-full border-[70px] motion-safe:animate-[spin_50s_linear_infinite]"
				/>
				<div
					aria-hidden
					className="border-accent-ink/30 absolute -bottom-[220px] -left-[100px] size-[420px] rounded-full border border-dashed"
				/>

				<div className="relative max-w-[520px]">
					<h2 className="text-[13px] font-semibold tracking-[0.08em] uppercase opacity-75">
						{next.heading}
					</h2>
					<ol className="mt-[18px] mb-10 grid gap-3">
						{next.steps.map((text, index) => (
							<li
								key={text}
								data-reveal
								className={cn(
									'flex items-center gap-3.5 text-[17px]',
									index === 1 && 'delay-[80ms]',
									index === 2 && 'delay-[160ms]'
								)}
							>
								<span
									className={cn(
										'grid size-[30px] flex-none place-items-center rounded-full text-[14px] font-bold',
										index === 0 ? 'bg-accent-ink text-accent' : 'bg-accent-ink/15'
									)}
								>
									{index + 1}
								</span>
								{text}
							</li>
						))}
					</ol>

					<div aria-hidden className="relative h-[330px]">
						<div className="border-accent-ink/25 bg-accent-ink/10 absolute top-0 -right-5 left-10 h-[250px] [transform:rotate(var(--tilt))] rounded-3xl border [--tilt:4deg] motion-safe:animate-[float_7s_ease-in-out_-3s_infinite]" />
						<div className="bg-surface text-text absolute top-[30px] right-5 left-0 [transform:rotate(var(--tilt))] rounded-3xl p-[26px] shadow-[0_40px_80px_-30px_var(--shadow)] [--tilt:-2deg] motion-safe:animate-[float_6s_ease-in-out_infinite]">
							{card}
						</div>
					</div>
				</div>
			</aside>
		</BrandTheme>
	)
}

// The row of bars over the sign-up heading: how far through getting started
// this page is.
export function StepBars({ total, label }: { total: number; label: string }) {
	return (
		<p data-reveal className="text-text-faint flex items-center gap-1.5 text-[13px] font-medium">
			{Array.from({ length: total }, (_, index) => (
				<span
					key={index}
					aria-hidden
					className={cn('h-1.5 rounded-md', index === 0 ? 'bg-accent w-7' : 'bg-border-strong w-4')}
				/>
			))}
			<span className="ml-2">{label}</span>
		</p>
	)
}
