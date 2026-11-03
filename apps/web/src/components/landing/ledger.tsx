import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/cn'

// The ledger on a night field: what it counts on the left, and on the right
// four weeks of one person's promises, one square a day, with the entries
// they add up from. The squares pop in, one after another, as the panel
// arrives.
const DAYS = 'pkkkkksskkkkpkkkkkkkpkkkkkkk'
const FILL = { k: 'bg-kept', p: 'bg-partly', s: 'bg-slipped' } as const
const isDay = (code: string): code is keyof typeof FILL => code in FILL
const LEGEND = [
	{ key: 'kept', fill: FILL.k },
	{ key: 'partly', fill: FILL.p },
	{ key: 'slipped', fill: FILL.s }
] as const

export async function Ledger() {
	const t = await getTranslations('HomePage.ledger')
	const stats = [
		{ value: t('stats.time'), label: t('stats.timeLabel') },
		{ value: t('stats.sizes'), label: t('stats.sizesLabel') },
		{ value: t('stats.installs'), label: t('stats.installsLabel') }
	]
	const rows = [
		{ text: t('rows.kept'), value: t('rows.keptValue'), tone: 'text-kept' },
		{ text: t('rows.partly'), value: t('rows.partlyValue'), tone: 'text-partly' },
		{ text: t('rows.moved'), value: t('rows.movedValue'), tone: 'text-coral' }
	]

	return (
		<section
			id="ledger"
			aria-labelledby="ledger-heading"
			className="bg-night text-night-ink scroll-mt-16"
		>
			<div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-14 px-(--page-margin) py-32">
				<div className="min-w-0 flex-[1_1_380px]">
					<p
						data-reveal
						className="text-coral text-[14px] font-semibold tracking-[0.08em] uppercase"
					>
						{t('eyebrow')}
					</p>
					<h2
						id="ledger-heading"
						data-reveal
						className="face-display text-head mt-3.5 mb-5 font-extrabold delay-[70ms]"
					>
						{t('heading')}
					</h2>
					<p data-reveal className="text-night-muted text-[18px] leading-[1.6] delay-[140ms]">
						{t('body')}
					</p>
					<dl data-reveal className="mt-9 flex flex-wrap gap-7 delay-[210ms]">
						{stats.map((stat) => (
							<div key={stat.label} className="flex flex-col-reverse">
								<dt className="text-night-muted text-[14px]">{stat.label}</dt>
								<dd className="face-display text-[44px] font-extrabold">{stat.value}</dd>
							</div>
						))}
					</dl>
				</div>

				<div
					data-reveal
					className="bg-night-surface border-night-border group min-w-0 flex-[1.2_1_440px] rounded-[28px] border p-7 delay-[140ms]"
				>
					<div className="flex flex-wrap items-center justify-between gap-3">
						<h3 className="face-display text-[22px] font-bold">{t('chartTitle')}</h3>
						<ul className="text-night-muted flex gap-3.5 text-[13px]">
							{LEGEND.map((item) => (
								<li key={item.key} className="flex items-center gap-1.5">
									<span aria-hidden className={cn('size-2.5 rounded-[3px]', item.fill)} />
									{t(`legend.${item.key}`)}
								</li>
							))}
						</ul>
					</div>
					<div role="img" aria-label={t('gridLabel')} className="mt-[22px] grid grid-cols-7 gap-2">
						{[...DAYS].filter(isDay).map((code, index) => (
							<span
								key={index}
								className={cn(
									'aspect-square rounded-[10px] motion-safe:group-[.is-in]:animate-[pop_.5s_var(--ease-out)_both]',
									FILL[code]
								)}
								style={{ animationDelay: `${index * 30}ms` }}
							/>
						))}
					</div>
					<ul className="mt-6 text-[15px]">
						{rows.map((row) => (
							<li
								key={row.text}
								className="border-night-border flex justify-between border-t py-3.5"
							>
								<span className="text-night-muted">{row.text}</span>
								<strong className={row.tone}>{row.value}</strong>
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	)
}
