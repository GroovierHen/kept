import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/cn'

// Pieces of the Today screen, drawn at real size with Sara's numbers from the
// walkthrough. They stand in for screenshots on the home page and beside the
// sign-in forms until the real screens exist. Each root carries data-ui: it
// follows the app's conventions inside (small labels, a bordered field), not
// the page's.

function Frame({
	day,
	step,
	className,
	children
}: {
	day: string
	step: string
	className?: string
	children: React.ReactNode
}) {
	return (
		<div
			data-ui
			className={cn(
				'bg-surface text-text flex h-full flex-col gap-4 rounded p-5 sm:p-6',
				className
			)}
		>
			<p className="text-small text-text-muted flex gap-2">
				<span>{day}</span>
				<span aria-hidden>·</span>
				<span>{step}</span>
			</p>
			{children}
		</div>
	)
}

export async function ReportFragment({ className }: { className?: string }) {
	const t = await getTranslations('Fragments.report')
	const answers = [
		{ label: t('yes'), chosen: true },
		{ label: t('partly'), chosen: false },
		{ label: t('no'), chosen: false }
	]
	return (
		<Frame day={t('day')} step={t('step')} className={className}>
			<p className="text-body lg:text-lead max-w-[22ch] font-medium tracking-[-0.02em]">
				{t('question')}
			</p>
			<div className="mt-auto grid grid-cols-3 gap-2" aria-hidden>
				{answers.map((answer) => (
					<span
						key={answer.label}
						className={cn(
							'text-body flex h-11 items-center justify-center rounded',
							answer.chosen ? 'bg-accent text-accent-ink' : 'border-border border'
						)}
					>
						{answer.label}
					</span>
				))}
			</div>
		</Frame>
	)
}

export async function LearnFragment({ className }: { className?: string }) {
	const t = await getTranslations('Fragments.learn')
	return (
		<Frame day={t('day')} step={t('step')} className={className}>
			<p className="text-small sm:text-body max-w-[34ch] font-medium">{t('question')}</p>
			<p className="border-border text-small rounded border px-3 py-2">{t('answer')}</p>
			<p className="text-small mt-auto flex flex-wrap gap-x-3">
				<span className="bg-field-2 text-field-2-ink rounded-sm px-1.5 font-medium">
					{t('mark')}
				</span>
				<span>{t('reason')}</span>
			</p>
		</Frame>
	)
}

export async function PromiseFragment({ className }: { className?: string }) {
	const t = await getTranslations('Fragments.promise')
	return (
		<Frame day={t('day')} step={t('step')} className={className}>
			<p className="text-body lg:text-lead max-w-[24ch] font-medium tracking-[-0.02em]">
				{t('sentence')}
			</p>
			<p className="text-small text-text-muted">{t('saves')}</p>
			<div className="mt-auto flex flex-col gap-2">
				<div className="bg-field-4 h-3 overflow-hidden rounded-sm">
					{/* £9 of £11 a day. */}
					<div className="bg-accent h-full w-[82%]" />
				</div>
				<p className="text-small">{t('progress')}</p>
			</div>
		</Frame>
	)
}

export async function LedgerFragment({ className }: { className?: string }) {
	const t = await getTranslations('Fragments.ledger')
	return (
		<Frame day={t('day')} step={t('step')} className={className}>
			<dl className="grid grid-cols-2 gap-2">
				<div className="bg-field-3 text-field-3-ink rounded px-4 py-3">
					<dt className="text-small">{t('kept')}</dt>
					<dd className="text-head font-medium tabular-nums">{t('keptCount')}</dd>
				</div>
				<div className="bg-field-4 text-field-4-ink rounded px-4 py-3">
					<dt className="text-small">{t('slipped')}</dt>
					<dd className="text-head font-medium tabular-nums">{t('slippedCount')}</dd>
				</div>
			</dl>
			<p className="text-small mt-auto max-w-[36ch]">{t('worth')}</p>
		</Frame>
	)
}
