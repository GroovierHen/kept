import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { SiteNav } from './site-nav'
import { HeroReel } from './hero-reel'
import { LearnFragment, LedgerFragment, PromiseFragment, ReportFragment } from './fragments'

// The first screen: "Promises, kept." split in two, with a reel of the Today
// screen passing through the gap. The section is 2.2 screens tall and its
// stage is sticky, so scrolling steps the reel through one check-in while the
// sentence holds. The h1 keeps a gap the size of the frame (a spacer on a
// phone, where the halves stack; the space between the halves on a wide
// screen), and the reel is laid over that gap.
export async function Hero() {
	const t = await getTranslations('HomePage.hero')
	const captions = [t('steps.report'), t('steps.learn'), t('steps.promise'), t('steps.ledger')]
	const frames = [
		<ReportFragment key="report" />,
		<LearnFragment key="learn" />,
		<PromiseFragment key="promise" />,
		<LedgerFragment key="ledger" />
	]

	return (
		<section data-reel-track className="relative h-[220svh]">
			<div className="sticky top-0 h-svh overflow-hidden">
				<div className="absolute inset-x-0 top-0 z-10">
					<SiteNav sections />
				</div>

				<div className="relative flex h-full flex-col justify-center px-(--page-margin) pt-16 lg:block lg:p-0">
					<div className="relative">
						<h1 className="text-head flex flex-col leading-[0.9] font-medium tracking-[-0.05em] lg:absolute lg:inset-x-0 lg:top-[50svh] lg:-translate-y-1/2 lg:flex-row lg:justify-between lg:px-(--page-margin)">
							<span data-reveal>{t('before')}</span>
							{/* Room for the reel and its caption between the halves. */}
							<span
								aria-hidden
								className="block h-[calc(var(--frame-h)+3.5rem)] [--frame-h:calc((100vw-2*var(--page-margin))*0.75)] md:[--frame-h:52.5vw] lg:hidden"
							/>
							<span data-reveal className="self-end delay-[120ms] lg:self-auto">
								{t('after')}
							</span>
						</h1>

						<HeroReel
							label={t('reelLabel')}
							frames={frames}
							captions={captions}
							className="absolute inset-x-0 top-[calc(var(--text-head)*0.9+1rem)] md:right-auto md:left-1/2 md:w-[70vw] md:-translate-x-1/2 lg:top-[calc(50svh-var(--frame-h)/2)] lg:w-[44vw]"
						/>
					</div>

					<div
						data-reveal
						className="mt-8 flex max-w-[24rem] flex-col items-start gap-6 delay-[240ms] lg:absolute lg:top-[calc(50svh+var(--text-head)*0.45+2.5rem)] lg:left-(--page-margin) lg:mt-0 lg:w-[calc((100vw-44vw)/2-2*var(--page-margin))]"
					>
						<p className="text-lead lg:text-body">{t('support')}</p>
						<Button asChild size="lg" className="text-body h-12 px-6">
							<Link href="/sign-up">{t('start')}</Link>
						</Button>
					</div>
				</div>
			</div>
		</section>
	)
}
