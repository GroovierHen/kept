import type { ReactNode } from 'react'
import { ChevronDownIcon } from '@/components/ui/icons'

// Closed by default and needs no client code, so a correction never gets in the
// way of the step on screen.
export function ChangePanel({
	summary,
	hint,
	children
}: {
	summary: string
	hint: string
	children: ReactNode
}) {
	return (
		<details className="group border-border bg-surface rounded-[20px] border px-5 py-1">
			<summary className="text-accent flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
				<span className="underline underline-offset-4">{summary}</span>
				<ChevronDownIcon
					size={18}
					className="flex-none transition-transform group-open:rotate-180"
				/>
			</summary>
			<div className="flex flex-col gap-3 pt-1 pb-5">
				<p className="text-text-muted text-[14px]">{hint}</p>
				{children}
			</div>
		</details>
	)
}
