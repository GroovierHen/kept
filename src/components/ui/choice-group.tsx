'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { cn } from '@/lib/cn'

export type Choice<T extends string> = {
	value: T
	label: React.ReactNode
	detail?: React.ReactNode
}

type ChoiceGroupProps<T extends string> = {
	/** What's being chosen. Read out by screen readers, not shown: put a visible question nearby. */
	label: string
	choices: readonly Choice<T>[]
	value: T | null
	onChange: (value: T) => void
	layout?: 'row' | 'stack'
	className?: string
}

export function ChoiceGroup<T extends string>({
	label,
	choices,
	value,
	onChange,
	layout = 'row',
	className
}: ChoiceGroupProps<T>) {
	const handleValueChange = (next: string) => {
		const choice = choices.find((candidate) => candidate.value === next)
		if (choice != null) onChange(choice.value)
	}

	return (
		<RadioGroupPrimitive.Root
			aria-label={label}
			value={value}
			onValueChange={handleValueChange}
			orientation={layout === 'row' ? 'horizontal' : 'vertical'}
			className={cn(
				'gap-2',
				layout === 'row' ? 'grid auto-cols-fr grid-flow-col' : 'flex flex-col',
				className
			)}
		>
			{choices.map((choice) => (
				<RadioGroupPrimitive.Item
					key={choice.value}
					value={choice.value}
					className={cn(
						'group border-border bg-surface text-text text-small hover:bg-surface-hover focus-visible:outline-accent min-h-12 rounded border px-3 py-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
						'data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-ink',
						layout === 'row' ? 'text-center' : 'text-left'
					)}
				>
					<span className="block">{choice.label}</span>
					{choice.detail != null && (
						<span className="text-text-muted group-data-[state=checked]:text-accent-ink block font-normal transition-colors">
							{choice.detail}
						</span>
					)}
				</RadioGroupPrimitive.Item>
			))}
		</RadioGroupPrimitive.Root>
	)
}
