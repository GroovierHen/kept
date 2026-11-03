import { cn } from '@/lib/cn'
import { CheckIcon } from '@/components/ui/icons'

type StepCardProps = Omit<React.ComponentProps<'section'>, 'title'> & {
	title: React.ReactNode
	eyebrow?: React.ReactNode
	status?: 'active' | 'done'
	/** Shown instead of the children once the step is done. */
	summary?: React.ReactNode
}

export function StepCard({
	title,
	eyebrow,
	status = 'active',
	summary,
	className,
	children,
	...props
}: StepCardProps) {
	const isDone = status === 'done'

	return (
		<section
			className={cn(
				'border-border bg-surface flex flex-col gap-4 rounded-lg border p-4',
				className
			)}
			{...props}
		>
			<div className="flex items-start gap-3">
				{isDone && (
					<span className="text-success mt-0.5 flex shrink-0">
						<CheckIcon />
					</span>
				)}
				<div className="flex min-w-0 flex-col gap-1">
					{eyebrow != null && <p className="text-text-muted text-small font-medium">{eyebrow}</p>}
					<h2 className="text-text text-body font-semibold">{title}</h2>
					{isDone && summary != null && <div className="text-text-muted text-small">{summary}</div>}
				</div>
			</div>
			{!isDone && children}
		</section>
	)
}
