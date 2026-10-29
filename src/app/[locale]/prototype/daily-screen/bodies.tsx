'use client'

// PROTOTYPE ONLY: the report and commit controls, shared by variants A and B
// so they differ in layout, not in what's asked.
import { Button } from '@/components/ui/button'
import { CalendarIcon } from '@/components/ui/icons'
import {
	MOMENTS,
	PROMISE_OPTIONS,
	REPORT_LABELS,
	SARA,
	type CheckIn,
	type Moment,
	type Report
} from './check-in'
import { ChoiceGroup, Money, ProgressBar } from './shared-pieces'

export function ReportChoices({ checkIn }: { checkIn: CheckIn }) {
	return (
		<ChoiceGroup<Report>
			label={checkIn.reportQuestion}
			value={checkIn.state.report}
			onChange={checkIn.setReport}
			choices={(['yes', 'partly', 'no'] as const).map((value) => ({
				value,
				label: REPORT_LABELS[value]
			}))}
		/>
	)
}

export function CommitControls({ checkIn }: { checkIn: CheckIn }) {
	return (
		<div className="space-y-4">
			<ChoiceGroup
				label="Pick a promise"
				layout="stack"
				value={checkIn.state.pickedOption}
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
			<ProgressBar
				value={checkIn.covered}
				max={SARA.monthlyTarget}
				label={
					<>
						Your promises cover <Money pounds={checkIn.covered} /> of your{' '}
						<Money pounds={SARA.monthlyTarget} per="month" />
					</>
				}
			/>
			<div>
				<p className="text-text mb-2 text-sm font-medium">When?</p>
				<ChoiceGroup<Moment>
					label="When"
					value={checkIn.state.pickedMoment}
					onChange={checkIn.pickMoment}
					choices={MOMENTS.map((m) => ({ value: m, label: m }))}
				/>
			</div>
			{checkIn.promiseSentence && (
				<p className="text-text bg-surface-hover rounded p-3 text-sm">
					“{checkIn.promiseSentence}”
				</p>
			)}
			<Button
				className="w-full"
				size="lg"
				disabled={!checkIn.promiseSentence}
				onClick={checkIn.commit}
			>
				Promise it for {checkIn.commitFor}
			</Button>
		</div>
	)
}

export function LockedPromise({ checkIn }: { checkIn: CheckIn }) {
	return (
		<div className="space-y-2 text-sm">
			<p className="text-text">“{checkIn.promiseSentence}”</p>
			<p className="text-text-muted">
				For {checkIn.commitFor}. Locked in. We’ll ask you about it {checkIn.commitFor} evening.
			</p>
			<Button variant="outline" size="sm" disabled>
				<CalendarIcon /> Add to calendar (should tier)
			</Button>
		</div>
	)
}

export function GapNote() {
	return (
		<p className="text-text-muted bg-surface-hover rounded p-3 text-sm">
			Welcome back. Your last promise wasn’t reported in time, so it’s closed. It doesn’t count
			against you.
		</p>
	)
}
