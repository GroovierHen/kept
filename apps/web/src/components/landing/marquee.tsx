import { getTranslations } from 'next-intl/server'
import { CheckIcon } from '@/components/ui/icons'

// A dark band, tipped a little, of promises a day with Kept could hold,
// running sideways. The list is set twice so the loop has no seam; the copy is
// hidden from screen readers so each promise is read once.
const PROMISES = ['read', 'jog', 'water', 'journal', 'stretch', 'spanish', 'phone', 'walk'] as const
const DOTS = ['bg-kept', 'bg-coral', 'bg-accent-soft', 'bg-partly'] as const

export async function Marquee() {
	const t = await getTranslations('HomePage.marquee')

	const list = (copy: boolean) => (
		<ul aria-hidden={copy || undefined} className="flex shrink-0 gap-3.5 pr-3.5">
			{PROMISES.map((key, index) => (
				<li
					key={key}
					className="border-night-border flex items-center gap-3 rounded-full border px-[18px] py-2.5 text-[16px] whitespace-nowrap"
				>
					<span
						aria-hidden
						className={`text-night grid size-[22px] place-items-center rounded-full ${DOTS[index % DOTS.length]}`}
					>
						<CheckIcon size={13} />
					</span>
					{t(`items.${key}`)}
				</li>
			))}
		</ul>
	)

	return (
		<section
			aria-label={t('label')}
			className="bg-night text-night-ink mx-[-20px] -rotate-[1.2deg] overflow-hidden py-[22px]"
		>
			<div className="flex w-max motion-safe:animate-[marquee_38s_linear_infinite]">
				{list(false)}
				{list(true)}
			</div>
		</section>
	)
}
