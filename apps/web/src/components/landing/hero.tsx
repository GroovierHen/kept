import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon, CheckIcon, ClockIcon } from '@/components/ui/icons'
import { lift } from '@/components/brand/lift'
import { HeroReel } from './hero-reel'

// The first screen: "Promises, kept." with the coral stroke drawn under the
// second word, and beside it a check-in on the Today screen stepping through
// its four parts on a tilted green panel. Three notes from the product float
// around the panel on wide screens.
export async function Hero() {
	const t = await getTranslations('HomePage.hero')
	const facts = [t('facts.install'), t('facts.time'), t('facts.missed')]

	return (
		<section
			id="top"
			className="relative mx-auto flex max-w-[1200px] flex-wrap items-center gap-14 px-(--page-margin) pt-[72px] pb-24"
		>
			<div
				aria-hidden
				className="border-border-strong pointer-events-none absolute -top-[120px] -right-[180px] size-[620px] rounded-full border border-dashed motion-safe:animate-[spin_40s_linear_infinite]"
			/>

			<div className="relative min-w-0 flex-[1_1_460px]">
				<p
					data-reveal
					className="bg-surface border-border inline-flex items-center gap-2.5 rounded-full border py-1.5 pr-3.5 pl-1.5 text-[14px] font-medium"
				>
					<span className="bg-accent-soft text-accent rounded-full px-2.5 py-1 font-semibold">
						{t('badge')}
					</span>
					{t('badgeText')}
				</p>
				<h1 data-reveal className="face-display text-display mt-6 font-extrabold delay-[100ms]">
					{t('before')}
					<br />
					<span className="text-accent relative inline-block">
						{t('after')}
						<svg
							viewBox="0 0 300 30"
							preserveAspectRatio="none"
							aria-hidden
							className="absolute -bottom-3.5 left-0 h-6 w-full"
						>
							<path
								d="M4 20 C 70 4, 150 4, 296 16"
								fill="none"
								stroke="var(--coral)"
								strokeWidth="7"
								strokeLinecap="round"
								className="[stroke-dasharray:420] motion-safe:animate-[draw_1.4s_0.7s_cubic-bezier(.6,0,.2,1)_both]"
							/>
						</svg>
					</span>
				</h1>
				<p
					data-reveal
					className="text-text-muted mt-9 max-w-[520px] text-[20px] leading-[1.55] delay-[220ms]"
				>
					{t('support')}
				</p>
				<div data-reveal className="mt-8 flex flex-wrap gap-3 delay-[340ms]">
					<Button
						asChild
						size="lg"
						className={`h-auto gap-2.5 px-[26px] py-4 text-[17px] font-semibold ${lift}`}
					>
						<Link href="/sign-up">
							{t('start')}
							<ArrowRightIcon size={18} />
						</Link>
					</Button>
					<Button
						asChild
						variant="outline"
						size="lg"
						className="bg-surface h-auto px-[22px] py-4 text-[17px] font-semibold"
					>
						<a href="#how">{t('how')}</a>
					</Button>
				</div>
				<ul
					data-reveal
					className="text-text-faint mt-8 flex flex-wrap gap-x-[22px] gap-y-2 text-[14px] delay-[460ms]"
				>
					{facts.map((fact) => (
						<li key={fact} className="flex items-center gap-2">
							<CheckIcon size={16} className="text-success" />
							{fact}
						</li>
					))}
				</ul>
			</div>

			<div
				data-reveal
				className="relative flex h-[560px] min-w-0 flex-[1_1_420px] items-center justify-center delay-[340ms]"
			>
				<div
					aria-hidden
					className="bg-accent text-accent-ink absolute inset-x-[30px] inset-y-10 -rotate-4 rounded-[40px]"
				>
					<div className="dot-grid absolute inset-0 rounded-[40px] [background-size:22px_22px]" />
				</div>

				<HeroReel />

				<p className="bg-surface absolute top-[70px] -left-2.5 hidden [transform:rotate(var(--tilt))] items-center gap-2.5 rounded-2xl px-3.5 py-3 text-[14px] font-semibold shadow-[0_18px_40px_-18px_var(--shadow)] [--tilt:-6deg] motion-safe:animate-[float_6s_ease-in-out_infinite] md:flex">
					<span className="bg-coral-soft text-coral-deep grid size-[30px] place-items-center rounded-[9px]">
						<ClockIcon size={16} />
					</span>
					{t('chips.reminder')}
				</p>
				<p className="bg-night text-night-ink absolute right-[-8px] bottom-[74px] hidden [transform:rotate(var(--tilt))] rounded-2xl px-4 py-3 text-[14px] shadow-[0_18px_40px_-18px_var(--shadow)] [--tilt:5deg] motion-safe:animate-[float_7.5s_ease-in-out_-2s_infinite] md:block">
					<span className="text-night-muted block text-[12px]">{t('chips.milestoneLabel')}</span>
					<span className="mt-0.5 block font-semibold">{t('chips.milestone')}</span>
				</p>
				<p className="bg-coral text-coral-ink absolute top-[30px] right-[30px] hidden [transform:rotate(var(--tilt))] rounded-full px-4 py-2.5 text-[14px] font-bold shadow-[0_18px_40px_-18px_var(--shadow)] [--tilt:8deg] motion-safe:animate-[float_5.5s_ease-in-out_-4s_infinite] md:block">
					{t('chips.growing')}
				</p>
			</div>

			<a
				href="#how"
				className="text-text-faint absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1.5 rounded-sm text-[13px] focus-visible:outline-2 focus-visible:outline-offset-4 motion-safe:animate-[nudge_1.6s_ease-in-out_infinite] md:flex"
			>
				{t('scroll')}
				<ArrowRightIcon size={18} className="rotate-90" />
			</a>
		</section>
	)
}
