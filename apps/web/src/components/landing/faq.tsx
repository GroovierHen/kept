import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/cn'

const QUESTIONS = ['dayOne', 'ai', 'missed', 'install', 'numbers', 'advice'] as const
// Written out whole so Tailwind finds each class.
const DELAYS = [
	'',
	'delay-[70ms]',
	'delay-[140ms]',
	'delay-[210ms]',
	'delay-[280ms]',
	'delay-[280ms]'
]

// The honest answers, one panel each, opened by its question. The first is
// open, so the panel shows how it works; the rest are a click away and still
// in the page for search and screen readers.
export async function Faq() {
	const t = await getTranslations('HomePage.faq')

	return (
		<section
			id="questions"
			aria-labelledby="questions-heading"
			className="mx-auto max-w-[920px] scroll-mt-16 px-(--page-margin) pt-32 pb-24"
		>
			<h2
				id="questions-heading"
				data-reveal
				className="face-display mb-9 text-center text-[clamp(40px,5vw,60px)] leading-none font-extrabold"
			>
				{t('heading')}
			</h2>
			<div className="grid gap-3">
				{QUESTIONS.map((key, index) => (
					<details
						key={key}
						open={index === 0}
						data-reveal
						className={cn(
							'group bg-surface border-border rounded-[18px] border px-6 py-[22px]',
							DELAYS[index]
						)}
					>
						<summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-sm text-[18px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 [&::-webkit-details-marker]:hidden">
							{t(`items.${key}.q`)}
							<span
								aria-hidden
								className="text-accent text-[24px] leading-none transition-transform duration-200 group-open:rotate-45"
							>
								+
							</span>
						</summary>
						<p className="text-text-muted mt-3.5 leading-[1.6]">{t(`items.${key}.a`)}</p>
					</details>
				))}
			</div>
		</section>
	)
}
