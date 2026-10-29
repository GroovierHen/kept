'use client'

// PROTOTYPE ONLY. Variant B: one step at a time, full screen, like a short
// quiz. Only the current question is on screen; done is its own summary.
import { cn } from '@/lib/cn'
import { SuccessIcon } from '@/components/ui/icons'
import { SARA, type CheckIn, type Step } from './check-in'
import { CommitControls, GapNote, LockedPromise, ReportChoices } from './bodies'
import { LearnSlotStub } from './learn-slot-stub'
import { StepCard } from './shared-pieces'

export const variantBName = 'One step at a time'

const DOTS: { step: Step; label: string }[] = [
	{ step: 'report', label: 'Report' },
	{ step: 'learn', label: 'Learn' },
	{ step: 'commit', label: 'Promise' }
]

export function VariantB({ checkIn }: { checkIn: CheckIn }) {
	const { step } = checkIn
	const order: Step[] = ['report', 'learn', 'commit', 'done']
	const dots = checkIn.hasReport ? DOTS : DOTS.slice(1)

	return (
		<main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pt-4 pb-28">
			<div className="mb-8 flex items-center justify-between">
				<p className="text-text-muted text-sm">Day {SARA.dayN}</p>
				<ol className="flex items-center gap-2">
					{dots.map((d) => (
						<li
							key={d.step}
							className={cn(
								'h-1.5 w-10 rounded-full',
								order.indexOf(d.step) <= order.indexOf(step) ? 'bg-accent' : 'bg-border'
							)}
							aria-label={d.label}
						/>
					))}
				</ol>
			</div>

			{step === 'report' && (
				<div className="flex flex-1 flex-col justify-center gap-8">
					<h1 className="text-text text-3xl leading-tight font-semibold">
						{checkIn.reportQuestion}
					</h1>
					<ReportChoices checkIn={checkIn} />
				</div>
			)}

			{step === 'learn' && (
				<div className="space-y-6">
					{!checkIn.hasReport && <GapNote />}
					<h1 className="text-text text-3xl font-semibold">Quick one from last time</h1>
					<LearnSlotStub done={false} onDone={checkIn.finishLearn} />
				</div>
			)}

			{step === 'commit' && (
				<div className="space-y-6">
					<h1 className="text-text text-3xl font-semibold">
						What will you do {checkIn.commitFor}?
					</h1>
					<CommitControls checkIn={checkIn} />
				</div>
			)}

			{step === 'done' && (
				<div className="space-y-4">
					<div className="py-6 text-center">
						<span className="text-success inline-block text-5xl">
							<SuccessIcon />
						</span>
						<h1 className="text-text mt-2 text-3xl font-semibold">Done for today</h1>
						<p className="text-text-muted">2 minutes, well spent.</p>
					</div>
					{checkIn.hasReport && (
						<StepCard eyebrow="Your report" title={checkIn.reportQuestion}>
							<ReportChoices checkIn={checkIn} />
							<p className="text-text-faint mt-2 text-xs">You can change this until 4am.</p>
						</StepCard>
					)}
					<StepCard
						eyebrow={`Promise for ${checkIn.commitFor}`}
						title="Your next promise"
						status="done"
						summary={<LockedPromise checkIn={checkIn} />}
					/>
					<StepCard
						eyebrow="What you learned"
						title="Compound growth, 1 out of 2"
						status="done"
						summary="New habit: live below your means"
					/>
				</div>
			)}
		</main>
	)
}
