'use client'

// PROTOTYPE ONLY. Variant C: a coach thread. Kept asks, the user answers
// from a tray of choices pinned to the bottom, and the learn card drops
// into the thread as one message.
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import {
	MOMENTS,
	PROMISE_OPTIONS,
	REPORT_LABELS,
	SARA,
	type CheckIn,
	type Moment,
	type Report
} from './check-in'
import { LearnSlotStub } from './learn-slot-stub'
import { ChoiceGroup, Money, ProgressBar } from './shared-pieces'

export const variantCName = 'Coach thread'

const REACTIONS: Record<Report, string> = {
	yes: 'Nice one. That’s a promise kept.',
	partly: 'Partly still counts for something.',
	no: 'That’s fine. Tomorrow is another go.'
}

function Coach({ children }: { children: React.ReactNode }) {
	return (
		<div className="bg-surface border-border text-text max-w-[85%] rounded-lg rounded-bl-sm border px-3 py-2 text-sm">
			{children}
		</div>
	)
}

function Me({ children }: { children: React.ReactNode }) {
	return (
		<div className="bg-accent text-accent-ink ml-auto max-w-[85%] rounded-lg rounded-br-sm px-3 py-2 text-sm">
			{children}
		</div>
	)
}

export function VariantC({ checkIn }: { checkIn: CheckIn }) {
	const { step, state, option } = checkIn
	const reportedOrGap = !checkIn.hasReport || state.report !== null

	return (
		<main className="mx-auto flex min-h-screen max-w-md flex-col">
			<header className="border-border bg-bg sticky top-0 z-10 border-b px-4 py-3">
				<p className="text-text text-sm font-semibold">Kept</p>
				<p className="text-text-muted text-xs">
					Day {SARA.dayN} · {SARA.weekday}
				</p>
			</header>

			<div className="flex flex-1 flex-col gap-2 px-4 py-4">
				<Coach>Evening, Sara.</Coach>
				{!checkIn.hasReport && (
					<Coach>
						Welcome back. Your last promise wasn’t reported in time, so it’s closed. It doesn’t
						count against you.
					</Coach>
				)}
				{checkIn.hasReport && <Coach>{checkIn.reportQuestion}</Coach>}
				{state.report && (
					<>
						<Me>{REPORT_LABELS[state.report]}</Me>
						<Coach>{REACTIONS[state.report]}</Coach>
					</>
				)}

				{reportedOrGap && (
					<>
						<Coach>Quick one from last time.</Coach>
						<div className="bg-surface border-border rounded-lg border p-3">
							<LearnSlotStub done={state.learnDone} onDone={checkIn.finishLearn} />
						</div>
					</>
				)}

				{state.learnDone && <Coach>Now, what will you do {checkIn.commitFor}?</Coach>}
				{option && (
					<>
						<Me>{option.action}</Me>
						<Coach>
							<div className="space-y-2">
								<p>
									{option.poundsPerMonth === null ? (
										option.note
									) : (
										<>
											That saves about <Money pounds={option.poundsPerMonth} per="month" />.
										</>
									)}
								</p>
								<ProgressBar
									value={checkIn.covered}
									max={SARA.monthlyTarget}
									label={
										<>
											Covers <Money pounds={checkIn.covered} /> of your{' '}
											<Money pounds={SARA.monthlyTarget} per="month" />
										</>
									}
								/>
								<p>When will you do it?</p>
							</div>
						</Coach>
					</>
				)}
				{state.pickedMoment && <Me>{state.pickedMoment}</Me>}
				{checkIn.promiseSentence && !state.committed && (
					<Coach>
						“{checkIn.promiseSentence}” Promise it for {checkIn.commitFor}?
					</Coach>
				)}
				{state.committed && (
					<>
						<Me>Promise it</Me>
						<Coach>
							Locked in: “{checkIn.promiseSentence}” I’ll ask you about it {checkIn.commitFor}{' '}
							evening.
						</Coach>
					</>
				)}
			</div>

			<div className="border-border bg-bg sticky bottom-0 border-t px-4 pt-3 pb-20">
				{step === 'report' && (
					<ChoiceGroup<Report>
						label={checkIn.reportQuestion}
						value={null}
						onChange={checkIn.setReport}
						choices={(['yes', 'partly', 'no'] as const).map((v) => ({
							value: v,
							label: REPORT_LABELS[v]
						}))}
					/>
				)}
				{step === 'learn' && (
					<p className="text-text-faint text-center text-sm">Answer the question above</p>
				)}
				{step === 'commit' && !option && (
					<ChoiceGroup
						label="Pick a promise"
						layout="stack"
						value={null}
						onChange={checkIn.pickOption}
						choices={PROMISE_OPTIONS.map((o) => ({
							value: o.id,
							label: o.action,
							detail:
								o.poundsPerMonth === null ? (
									o.note
								) : (
									<>
										Saves about <Money pounds={o.poundsPerMonth} per="month" />
									</>
								)
						}))}
					/>
				)}
				{step === 'commit' && option && !state.pickedMoment && (
					<ChoiceGroup<Moment>
						label="When"
						value={null}
						onChange={checkIn.pickMoment}
						choices={MOMENTS.map((m) => ({ value: m, label: m }))}
					/>
				)}
				{step === 'commit' && checkIn.promiseSentence && (
					<Button className="w-full" size="lg" onClick={checkIn.commit}>
						Promise it for {checkIn.commitFor}
					</Button>
				)}
				{step === 'done' && (
					<div className={cn('space-y-2', !checkIn.hasReport && 'text-center')}>
						<p className="text-text-muted text-center text-sm">
							Done for today. See you {checkIn.commitFor} evening.
						</p>
						{checkIn.hasReport && (
							<>
								<p className="text-text-faint text-center text-xs">Change your report until 4am</p>
								<ChoiceGroup<Report>
									label="Change your report"
									value={state.report}
									onChange={checkIn.setReport}
									choices={(['yes', 'partly', 'no'] as const).map((v) => ({
										value: v,
										label: REPORT_LABELS[v]
									}))}
								/>
							</>
						)}
					</div>
				)}
			</div>
		</main>
	)
}
