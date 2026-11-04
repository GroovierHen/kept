import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import {
	GOAL_QUESTIONS,
	MAX_GOAL_ANSWER_LENGTH,
	PLAN_WEEKS,
	type GoalAnswerInput,
	type GoalQuestion,
	type PlanWeeks,
	type SetupView
} from '@kept/contract'
import { copy } from '@/copy'
import { useSaveGoalAnswer } from '@/hooks/use-setup'
import { errorMessage } from '@/lib/api'
import { colors, fontFamily, radii, space } from '@/lib/theme'
import { StepHeading } from '../check-in/step-heading'
import { Button } from '../ui/button'
import { ChoiceTiles } from '../ui/choice-tiles'
import { Text } from '../ui/text'
import { TextField } from '../ui/text-field'

type Goal = Extract<SetupView, { step: 'goal' }>
type WrittenQuestion = Exclude<GoalQuestion, 'weeks'>

const WEEK_CHOICES = PLAN_WEEKS.map((weeks) => ({
	value: String(weeks),
	label: copy.setup.goal.weeksOption(weeks)
}))

/** The goal's four screens, one question each, saved as it's answered. */
export function GoalStep({ view, eyebrow }: { view: Goal; eyebrow: string }) {
	const { question } = view
	return (
		<View style={styles.step}>
			<StepHeading
				eyebrow={`${eyebrow} · ${copy.setup.goal.progress(
					GOAL_QUESTIONS.indexOf(question) + 1,
					GOAL_QUESTIONS.length
				)}`}
				title={copy.setup.goal.questions[question]}
				lead={copy.setup.goal.hints[question]}
			/>
			{/* Keyed so each question starts from its own saved answer. */}
			{question === 'weeks' ? (
				<WeeksAnswer key={question} saved={view.answers.weeks} />
			) : (
				<WrittenAnswer key={question} question={question} saved={view.answers[question]} />
			)}
		</View>
	)
}

function WeeksAnswer({ saved }: { saved: number | null }) {
	const save = useSaveGoalAnswer()
	const [weeks, setWeeks] = useState<string | null>(saved == null ? null : String(saved))
	const [isMissing, setIsMissing] = useState(false)

	function submit() {
		const picked = PLAN_WEEKS.find((option) => String(option) === weeks)
		setIsMissing(picked == null)
		if (picked != null) save.mutate({ question: 'weeks', answer: picked satisfies PlanWeeks })
	}

	return (
		<>
			<ChoiceTiles
				label={copy.setup.goal.questions.weeks}
				choices={WEEK_CHOICES}
				value={weeks}
				onChange={setWeeks}
				direction="row"
			/>
			<SaveError isMissing={isMissing} message={copy.setup.goal.errors.weeks} error={save} />
			<Button label={copy.setup.continue} isPending={save.isPending} onPress={submit} />
		</>
	)
}

function WrittenAnswer({ question, saved }: { question: WrittenQuestion; saved: string | null }) {
	const save = useSaveGoalAnswer()
	const [answer, setAnswer] = useState(saved ?? '')
	const [isMissing, setIsMissing] = useState(false)

	function submit() {
		const trimmed = answer.trim()
		setIsMissing(trimmed === '')
		if (trimmed !== '') save.mutate({ question, answer: trimmed } satisfies GoalAnswerInput)
	}

	return (
		<>
			<TextField
				label={copy.setup.goal.questions[question]}
				placeholder={copy.setup.goal.placeholders[question]}
				value={answer}
				onChangeText={setAnswer}
				maxLength={MAX_GOAL_ANSWER_LENGTH}
				multiline
			/>
			<Text variant="small" tone="muted">
				{copy.setup.goal.examplesLabel}
			</Text>
			<View style={styles.chips}>
				{copy.setup.goal.examples[question].map((example) => (
					<Pressable
						key={example}
						accessibilityRole="button"
						onPress={() => setAnswer(example)}
						style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
					>
						<Text variant="small" style={styles.chipLabel}>
							{example}
						</Text>
					</Pressable>
				))}
			</View>
			<SaveError isMissing={isMissing} message={copy.setup.goal.errors.empty} error={save} />
			<Button label={copy.setup.continue} isPending={save.isPending} onPress={submit} />
		</>
	)
}

export function SaveError({
	isMissing,
	message,
	error
}: {
	isMissing: boolean
	message: string
	error: { isError: boolean; error: unknown }
}) {
	if (!isMissing && !error.isError) return null
	return (
		<Text tone="danger" accessibilityRole="alert">
			{isMissing ? message : errorMessage(error.error)}
		</Text>
	)
}

const styles = StyleSheet.create({
	step: { gap: space.md },
	chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
	chip: {
		borderRadius: radii.lg,
		borderWidth: 1,
		borderColor: colors.borderStrong,
		backgroundColor: colors.surface,
		paddingHorizontal: space.md,
		paddingVertical: space.sm
	},
	chipPressed: { backgroundColor: colors.surfaceHover },
	chipLabel: { fontFamily: fontFamily.textMedium }
})
