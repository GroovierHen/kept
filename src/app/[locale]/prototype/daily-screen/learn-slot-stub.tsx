'use client'

// PROTOTYPE ONLY: a stand-in for Abdelmalek's learn and recall card, so the
// variants have something real-sized in the slot. Built from the same
// shared pieces to check they're enough for Learn too. Not his design.
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChoiceGroup, Money } from './shared-pieces'

export function LearnSlotStub({ onDone, done }: { onDone: () => void; done: boolean }) {
	const [answer, setAnswer] = useState('around 20k plus a bit of interest')
	const [graded, setGraded] = useState(done)
	const [lessonSeen, setLessonSeen] = useState(done)
	const [mode, setMode] = useState<'type' | 'choice'>('type')
	const [choice, setChoice] = useState<string | null>(null)

	return (
		<div className="border-border-strong space-y-4 rounded border border-dashed p-3">
			<p className="text-text-faint text-xs">Learn slot (Abdelmalek’s card, stubbed)</p>

			<div className="space-y-2">
				<p className="text-text-faint text-xs font-medium uppercase">Recall · compound growth</p>
				<p className="text-text text-sm">
					You save £335 a month for 5 years. About how much will you have, and why is it more than
					you put in?
				</p>
				{!graded && mode === 'type' && (
					<>
						<label className="sr-only" htmlFor="recall-answer">
							Your answer
						</label>
						<Textarea
							id="recall-answer"
							value={answer}
							onChange={(e) => setAnswer(e.target.value)}
							rows={2}
						/>
						<div className="flex gap-2">
							<Button size="sm" onClick={() => setGraded(true)}>
								Check my answer
							</Button>
							<Button size="sm" variant="ghost" onClick={() => setMode('choice')}>
								Claude down? (MC fallback)
							</Button>
						</div>
					</>
				)}
				{!graded && mode === 'choice' && (
					<ChoiceGroup
						label="Pick an answer"
						layout="stack"
						value={choice}
						onChange={(v) => {
							setChoice(v)
							setGraded(true)
						}}
						choices={[
							{ value: 'a', label: 'About £20,100, what you put in' },
							{ value: 'b', label: 'About £22,200, your money earns money' },
							{ value: 'c', label: 'About £40,000, it doubles' }
						]}
					/>
				)}
				{graded && (
					<div className="bg-surface-hover rounded p-3 text-sm">
						<p className="text-text font-semibold">1 out of 2</p>
						<p className="text-text-muted">
							Right idea. But the interest is about <Money pounds={2100} />, not a bit. That’s your
							money earning money.
						</p>
					</div>
				)}
			</div>

			{graded && (
				<div className="space-y-2">
					<p className="text-text-faint text-xs font-medium uppercase">
						New habit · Live below your means
					</p>
					<p className="text-text text-sm">
						Your costs are about <Money pounds={53} per="day" />. Your £300 lasts 6 days if you lose
						your income. A safety net is usually 3 months of costs: <Money pounds={4800} />.
					</p>
					{!lessonSeen && (
						<Button
							size="sm"
							onClick={() => {
								setLessonSeen(true)
								onDone()
							}}
						>
							Got it
						</Button>
					)}
				</div>
			)}
		</div>
	)
}
