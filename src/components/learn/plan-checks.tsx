'use client'

import { useId, useState } from 'react'
import { CheckIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

// The gut check beside the plan before it's confirmed. Ticks are the
// person's own: nothing is saved and Confirm doesn't wait on them.
export function PlanChecks({ items, hint }: { items: readonly string[]; hint: string }) {
	const id = useId()
	const [checked, setChecked] = useState<readonly boolean[]>(() => items.map(() => false))

	return (
		<div className="relative flex flex-col gap-2">
			<ul className="flex flex-col gap-2">
				{items.map((item, index) => {
					const isChecked = checked[index] ?? false
					return (
						<li key={item}>
							<label
								htmlFor={`${id}-${index}`}
								className="border-accent-ink/20 bg-accent-ink/10 hover:bg-accent-ink/15 has-focus-visible:outline-coral flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3.5 text-[15px] leading-[1.45] has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
							>
								<input
									id={`${id}-${index}`}
									type="checkbox"
									checked={isChecked}
									onChange={() =>
										setChecked((current) =>
											current.map((value, position) => (position === index ? !value : value))
										)
									}
									className="sr-only"
								/>
								<span
									aria-hidden
									className={cn(
										'mt-px grid size-[22px] flex-none place-items-center rounded-[7px] border-2',
										isChecked ? 'border-coral bg-coral text-coral-ink' : 'border-accent-ink/60'
									)}
								>
									{isChecked && <CheckIcon size={13} />}
								</span>
								{item}
							</label>
						</li>
					)
				})}
			</ul>
			<p className="text-accent-ink/80 text-[13px] leading-[1.45]">{hint}</p>
		</div>
	)
}
