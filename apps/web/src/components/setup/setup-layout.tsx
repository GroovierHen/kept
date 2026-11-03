import { cn } from '@/lib/cn'

// The pieces each setup step lays out inside <SetupShell>: its main column,
// the question at the top of it, and the green panel beside it.

export function SetupMain({
	className,
	children
}: {
	className?: string
	children: React.ReactNode
}) {
	return (
		<main
			className={cn(
				'flex max-w-[640px] min-w-0 flex-[999_1_520px] flex-col pt-2 lg:pt-9',
				className
			)}
		>
			{children}
		</main>
	)
}

/** The bars and the "Question 1 of 4" line, then the step's one heading. */
export function StepIntro({
	progress,
	eyebrow,
	title,
	titleId
}: {
	progress: { current: number; total: number }
	eyebrow: string
	title: React.ReactNode
	titleId?: string
}) {
	return (
		<>
			<p className="text-text-faint flex items-center gap-1.5 text-[13px] font-medium">
				{Array.from({ length: progress.total }, (_, index) => (
					<span
						key={index}
						aria-hidden
						className={cn(
							'h-1.5 rounded-md',
							index === progress.current ? 'w-7' : 'w-4',
							index <= progress.current ? 'bg-accent' : 'bg-border-strong'
						)}
					/>
				))}
				<span className="ml-2">{eyebrow}</span>
			</p>
			<h1
				id={titleId}
				className="face-display mt-[22px] mb-3.5 text-[clamp(38px,4.4vw,58px)] leading-none font-extrabold"
			>
				{title}
			</h1>
		</>
	)
}

export function SetupAside({
	label,
	lead,
	children
}: {
	label: string
	lead: string
	children: React.ReactNode
}) {
	return (
		<aside
			aria-label={label}
			className="bg-accent text-accent-ink relative flex min-w-0 flex-[1_1_380px] flex-col gap-7 self-start overflow-hidden rounded-[28px] p-[clamp(28px,3.2vw,44px)] lg:sticky lg:top-6"
		>
			<div aria-hidden className="dot-grid absolute inset-0 [background-size:22px_22px]" />
			{/* Sized to stay in the corner: the heading's right padding keeps every line clear of it. */}
			<div
				aria-hidden
				className="border-coral absolute -top-[150px] -right-[150px] size-[260px] rounded-full border-[44px]"
			/>
			<div
				aria-hidden
				className="border-accent-ink/30 absolute -bottom-[240px] -left-[120px] size-[440px] rounded-full border border-dashed"
			/>
			<div className="relative max-w-[380px] pr-14">
				<p className="text-[12px] font-semibold tracking-[0.08em] uppercase opacity-80">{label}</p>
				<p className="face-display mt-3 text-[clamp(24px,2.1vw,28px)] leading-[1.12] font-bold">
					{lead}
				</p>
			</div>
			{children}
		</aside>
	)
}

/** The white card that floats on the green panel, tilted a little. */
export function AsideCard({
	className,
	children
}: {
	className?: string
	children: React.ReactNode
}) {
	return (
		<div
			className={cn(
				'bg-surface text-text relative -rotate-[1.2deg] rounded-3xl p-6 shadow-[0_40px_80px_-30px_var(--shadow)]',
				className
			)}
		>
			{children}
		</div>
	)
}

/** A numbered list at the foot of the green panel, the first item marked in lime. */
export function AsideSteps({ heading, items }: { heading: string; items: readonly string[] }) {
	return (
		<div className="relative mt-auto">
			<h2 className="mb-3.5 text-[12px] font-semibold tracking-[0.08em] uppercase opacity-80">
				{heading}
			</h2>
			<ol className="flex flex-col gap-3">
				{items.map((item, index) => (
					<li key={item} className="flex items-start gap-3 text-[15px] leading-[1.45]">
						<span
							className={cn(
								'grid size-[26px] flex-none place-items-center rounded-full text-[13px] font-bold',
								index === 0 ? 'bg-coral text-coral-ink' : 'bg-accent-ink/15'
							)}
						>
							{index + 1}
						</span>
						<span className="pt-[3px]">{item}</span>
					</li>
				))}
			</ol>
		</div>
	)
}
