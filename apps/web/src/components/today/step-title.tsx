import { cn } from '@/lib/cn'

/** A step's own heading, in the display face, with an optional line over it. */
export function StepTitle({
	eyebrow,
	children
}: {
	eyebrow?: React.ReactNode
	children: React.ReactNode
}) {
	return (
		<>
			{eyebrow != null && (
				<p className="text-accent mt-[22px] text-[15px] font-semibold">{eyebrow}</p>
			)}
			<h2
				className={cn(
					'face-display mb-3.5 text-[clamp(34px,3.8vw,50px)] leading-[1.02] font-extrabold',
					eyebrow == null ? 'mt-[22px]' : 'mt-2.5'
				)}
			>
				{children}
			</h2>
		</>
	)
}
