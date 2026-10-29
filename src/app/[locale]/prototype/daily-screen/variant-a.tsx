'use client'

// PROTOTYPE ONLY. Variant A: one scrolling page. All three parts are always
// visible as cards; the active one is open, finished ones fold to a line.
import { Button } from '@/components/ui/button'
import { REPORT_LABELS, SARA, type CheckIn } from './check-in'
import { CommitControls, GapNote, LockedPromise, ReportChoices } from './bodies'
import { LearnSlotStub } from './learn-slot-stub'
import { StepCard } from './shared-pieces'

export const variantAName = 'Stacked page'

export function VariantA({ checkIn }: { checkIn: CheckIn }) {
	const { step, state } = checkIn

	return (
		<main className="mx-auto max-w-md space-y-3 px-4 pt-6 pb-28">
			<header className="mb-4">
				<p className="text-text-muted text-sm">
					Day {SARA.dayN} · {SARA.weekday}
				</p>
				<h1 className="text-text text-2xl font-semibold">
					{step === 'done' ? 'Done for today' : 'Today’s check-in'}
				</h1>
			</header>

			{checkIn.hasReport ? (
				<StepCard
					eyebrow="1 · Report"
					title={checkIn.reportQuestion}
					status={step === 'report' ? 'active' : 'done'}
					summary={
						state.report && (
							<>
								{REPORT_LABELS[state.report]}
								{step === 'done' && ' · you can change this until 4am'}
							</>
						)
					}
					action={
						step !== 'report' && (
							<Button size="sm" variant="ghost" onClick={checkIn.changeReport}>
								Change
							</Button>
						)
					}
				>
					<ReportChoices checkIn={checkIn} />
				</StepCard>
			) : (
				<GapNote />
			)}

			<StepCard
				eyebrow="2 · Learn"
				title="Recall and a new skill"
				status={step === 'report' ? 'locked' : step === 'learn' ? 'active' : 'done'}
				summary="Compound growth: 1 out of 2 · New: live below your means"
			>
				<LearnSlotStub done={state.learnDone} onDone={checkIn.finishLearn} />
			</StepCard>

			<StepCard
				eyebrow={`3 · Promise for ${checkIn.commitFor}`}
				title={step === 'done' ? 'Your next promise' : `What will you do ${checkIn.commitFor}?`}
				status={step === 'commit' ? 'active' : step === 'done' ? 'done' : 'locked'}
				summary={<LockedPromise checkIn={checkIn} />}
			>
				<CommitControls checkIn={checkIn} />
			</StepCard>
		</main>
	)
}
