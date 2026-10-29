'use client'

// PROTOTYPE ONLY: the 4 CANDIDATE shared design pieces, the second half of
// the ticket's question. Every variant builds from these and nothing else
// (plus the existing Button), so flipping variants tests whether these 4
// are enough for both Act and Learn.
//
//   1. StepCard     the panel one part of a check-in sits in (report, the
//                   learn/recall card, commit). Active, done or locked.
//   2. ChoiceGroup  big tap targets for picking one: Yes/Partly/No, promise
//                   options, moments, Learn's multiple-choice fallback.
//   3. Money        a £ figure in one consistent style: "£156 a month".
//   4. ProgressBar  "Your promises cover £156 of your £335 a month".
import { cn } from '@/lib/cn'
import { CheckIcon } from '@/components/ui/icons'

export function StepCard({
	eyebrow,
	title,
	status = 'active',
	summary,
	action,
	children,
	className
}: {
	eyebrow?: string
	title: string
	status?: 'active' | 'done' | 'locked'
	summary?: React.ReactNode
	action?: React.ReactNode
	children?: React.ReactNode
	className?: string
}) {
	return (
		<section
			className={cn(
				'border-border bg-surface rounded-lg border p-4',
				status === 'locked' && 'opacity-50',
				className
			)}
		>
			<div className="flex items-start gap-3">
				{status === 'done' && (
					<span className="bg-success mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white">
						<CheckIcon />
					</span>
				)}
				<div className="min-w-0 flex-1">
					{eyebrow && (
						<p className="text-text-faint text-xs font-medium tracking-wide uppercase">{eyebrow}</p>
					)}
					<h2 className="text-text text-base font-semibold">{title}</h2>
					{status === 'done' && summary && (
						<div className="text-text-muted mt-0.5 text-sm">{summary}</div>
					)}
				</div>
				{action}
			</div>
			{status === 'active' && children && <div className="mt-4">{children}</div>}
		</section>
	)
}

export type Choice<T extends string> = { value: T; label: string; detail?: React.ReactNode }

export function ChoiceGroup<T extends string>({
	label,
	choices,
	value,
	onChange,
	layout = 'row',
	disabled
}: {
	label: string
	choices: Choice<T>[]
	value: T | null
	onChange: (value: T) => void
	layout?: 'row' | 'stack'
	disabled?: boolean
}) {
	return (
		<div
			role="radiogroup"
			aria-label={label}
			className={cn(
				'gap-2',
				layout === 'row' ? 'grid auto-cols-fr grid-flow-col' : 'flex flex-col'
			)}
		>
			{choices.map((choice) => {
				const selected = choice.value === value
				return (
					<button
						key={choice.value}
						type="button"
						role="radio"
						aria-checked={selected}
						disabled={disabled}
						onClick={() => onChange(choice.value)}
						className={cn(
							'focus-visible:outline-accent min-h-12 rounded border px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-2',
							layout === 'row' && 'text-center',
							selected
								? 'border-accent bg-accent text-accent-ink'
								: 'border-border bg-surface text-text hover:bg-surface-hover',
							disabled && 'opacity-60'
						)}
					>
						<span className="block">{choice.label}</span>
						{choice.detail && (
							<span
								className={cn(
									'block text-xs font-normal',
									selected ? 'text-accent-ink' : 'text-text-muted'
								)}
							>
								{choice.detail}
							</span>
						)}
					</button>
				)
			})}
		</div>
	)
}

export function Money({
	pounds,
	per,
	size = 'sm'
}: {
	pounds: number
	per?: 'day' | 'week' | 'month' | 'year'
	size?: 'sm' | 'lg'
}) {
	return (
		<span className="whitespace-nowrap tabular-nums">
			<span className={cn('font-semibold', size === 'lg' && 'text-2xl')}>
				£{pounds.toLocaleString('en-GB')}
			</span>
			{per && <span className="font-normal opacity-75"> a {per}</span>}
		</span>
	)
}

export function ProgressBar({
	value,
	max,
	label
}: {
	value: number
	max: number
	label: React.ReactNode
}) {
	const percent = Math.min(100, Math.round((value / max) * 100))
	return (
		<div>
			<div className="text-text-muted mb-1.5 text-sm">{label}</div>
			<div
				role="progressbar"
				aria-valuemin={0}
				aria-valuemax={max}
				aria-valuenow={value}
				className="bg-surface-hover h-2 overflow-hidden rounded-full"
			>
				<div className="bg-success h-full transition-[width]" style={{ width: `${percent}%` }} />
			</div>
		</div>
	)
}
