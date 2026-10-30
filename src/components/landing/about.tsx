import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import ledgerCover from '../../../public/landing/account-book-ledger.jpg'
import accountOfHours from '../../../public/landing/account-book-of-hours.jpg'

// Where the method comes from and why progress is a ledger. The 1830s account
// book is set into the paragraph like a drop capital; below, a page from an
// 1846 account of hours opens wide. Both are public-domain objects from the
// Met, credited in the footer, and neither is presented as Kept's own.
export async function About() {
	const t = await getTranslations('HomePage.about')
	const facts = [t('facts.habits'), t('facts.time'), t('facts.advice')]

	return (
		<section
			aria-labelledby="about-heading"
			className="grid gap-10 px-(--page-margin) py-28 md:grid-cols-12 md:gap-x-(--gutter) md:py-44"
		>
			<ul className="text-small order-last flex flex-wrap gap-1.5 md:order-none md:col-span-2 md:flex-col md:gap-3 md:pt-3">
				{facts.map((fact) => (
					<li key={fact} className="bg-surface rounded px-3 py-2 md:bg-transparent md:p-0">
						{fact}
					</li>
				))}
			</ul>

			<div className="md:col-span-10 md:col-start-3">
				<h2
					id="about-heading"
					data-reveal
					className="text-head mb-10 font-medium tracking-[-0.05em] md:mb-14"
				>
					{t('heading')}
				</h2>
				<div data-reveal className="text-body md:text-lead max-w-[46ch] delay-[90ms]">
					<p>
						<span className="float-left mt-[0.15em] mr-[0.5em] block size-[6.6em] overflow-hidden rounded-sm md:size-[4.8em]">
							<Image
								src={ledgerCover}
								alt={t('imageAlt')}
								sizes="(min-width: 768px) 160px, 120px"
								className="size-full scale-150 object-cover motion-safe:animate-[drift_18s_var(--ease-soft)_infinite_alternate]"
							/>
						</span>
						{t('lead')}
					</p>
					<p className="text-text-muted mt-[1.2em]">{t('second')}</p>
				</div>

				<figure data-reveal className="mt-16 delay-[180ms] md:mt-24">
					<div className="aspect-[4/3] overflow-hidden rounded-sm md:aspect-[21/9]">
						<Image
							src={accountOfHours}
							alt={t('hoursAlt')}
							sizes="(min-width: 768px) 80vw, 100vw"
							className="size-full object-cover object-[50%_18%]"
						/>
					</div>
					<figcaption className="text-small text-text-muted mt-3">{t('hoursCaption')}</figcaption>
				</figure>
			</div>
		</section>
	)
}
