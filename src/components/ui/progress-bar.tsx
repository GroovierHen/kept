import { useId } from 'react'
import { cn } from '@/lib/cn'
import { progressPercent } from '@/lib/progress'

type ProgressBarProps = Omit<React.ComponentProps<'div'>, 'children'> & {
	value: number
	max: number
	label: React.ReactNode
}

export function ProgressBar({ value, max, label, className, ...props }: ProgressBarProps) {
	const labelId = useId()
	const percent = progressPercent({ value, max })

	return (
		<div className={cn('flex flex-col gap-2', className)} {...props}>
			<p id={labelId} className="text-text-muted text-small">
				{label}
			</p>
			<div
				role="progressbar"
				aria-labelledby={labelId}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={percent}
				className="bg-field-4 h-2 overflow-hidden rounded-sm"
			>
				<div
					className="bg-accent h-full transition-[width] motion-reduce:transition-none"
					style={{ width: `${percent}%` }}
				/>
			</div>
		</div>
	)
}
