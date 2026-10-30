import { getTranslations } from 'next-intl/server'

const QUESTIONS = ['advice', 'dayOne', 'ai', 'missed', 'install', 'numbers'] as const

// Every answer open, set as a table: large questions on the left work as an
// index, the answers sit beside them at reading size.
export async function Faq() {
	const t = await getTranslations('HomePage.faq')

	return (
		<section
			id="questions"
			aria-labelledby="questions-heading"
			className="bg-surface scroll-mt-8 px-(--page-margin) py-28 md:py-44"
		>
			<h2
				id="questions-heading"
				data-reveal
				className="text-lead text-text-muted mb-14 font-medium tracking-[-0.03em] md:mb-20"
			>
				{t('heading')}
			</h2>
			<dl className="flex flex-col gap-14 md:gap-20">
				{QUESTIONS.map((key) => (
					<div key={key} data-reveal className="grid gap-3 md:grid-cols-12 md:gap-x-(--gutter)">
						<dt className="text-lead max-w-[22ch] font-medium tracking-[-0.03em] md:col-span-6">
							{t(`items.${key}.q`)}
						</dt>
						<dd className="text-body max-w-[42ch] md:col-span-5 md:col-start-8 md:pt-1.5">
							{t(`items.${key}.a`)}
						</dd>
					</div>
				))}
			</dl>
		</section>
	)
}
