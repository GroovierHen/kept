import type { ReactNode } from 'react'

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
		<details className="flex flex-col gap-3">
			<summary className="text-small text-text-muted cursor-pointer underline">{summary}</summary>
			<div className="mt-3 flex flex-col gap-3">
				<p className="text-small text-text-muted">{hint}</p>
				{children}
			</div>
		</details>
	)
}
