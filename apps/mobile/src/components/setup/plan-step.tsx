import { useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { MAX_GOAL_ANSWER_LENGTH, type PlanBuildResult, type SetupView } from '@kept/contract'
import { copy } from '@/copy'
import { useBuildPlan, useSaveGoalAnswer } from '@/hooks/use-setup'
import { colors, fontFamily, space } from '@/lib/theme'
import { StepHeading } from '../check-in/step-heading'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Text } from '../ui/text'
import { TextField } from '../ui/text-field'
import { SaveError } from './goal-step'
import { PlanReview } from './plan-review'

type Plan = Extract<SetupView, { step: 'plan' }>['plan']

/** Make the plan from the goal, wait while it's written, then review it. */
export function PlanStep({ plan, eyebrow }: { plan: Plan; eyebrow: string }) {
	if (plan.status === 'plan_made') return <PlanReview draft={plan.draft} eyebrow={eyebrow} />
	return <BuildPlan goalText={plan.goalText} isBuilding={plan.isBuilding} eyebrow={eyebrow} />
}

function BuildPlan({
	goalText,
	isBuilding,
	eyebrow
}: {
	goalText: string
	isBuilding: boolean
	eyebrow: string
}) {
	const build = useBuildPlan({ isRebuild: false })
	const result: PlanBuildResult | undefined = build.data
	const isWriting = build.isPending || isBuilding

	return (
		<View style={styles.step}>
			<StepHeading
				eyebrow={eyebrow}
				title={copy.setup.plan.buildTitle}
				lead={copy.setup.plan.buildBody}
			/>
			<Card>
				<Text variant="small" tone="muted">
					{goalText}
				</Text>
				{copy.setup.plan.features.map((feature) => (
					<Text key={feature} style={styles.feature}>
						{`· ${feature}`}
					</Text>
				))}
			</Card>
			<Text variant="small" tone="muted">
				{copy.setup.plan.privacy}
			</Text>

			{isWriting ? (
				<View style={styles.writing} accessibilityLiveRegion="polite">
					<ActivityIndicator color={colors.accent} />
					<Text>{copy.setup.plan.pending}</Text>
				</View>
			) : result?.kind === 'unsafe' || result?.kind === 'blocked' ? (
				<RewordGoal
					key={result.kind}
					message={result.kind === 'unsafe' ? copy.setup.plan.unsafe : copy.setup.plan.blocked}
					suggestion={result.kind === 'unsafe' ? result.saferGoal : goalText}
					onSaved={() => build.mutate()}
				/>
			) : (
				<>
					{(build.isError || result?.kind === 'failed') && (
						<Text tone="danger" accessibilityRole="alert">
							{copy.setup.plan.failed}
						</Text>
					)}
					<Button label={copy.setup.plan.submit} onPress={() => build.mutate()} />
				</>
			)}
		</View>
	)
}

/** The AI couldn't plan the goal as worded: use its safer wording, or the person's own. */
function RewordGoal({
	message,
	suggestion,
	onSaved
}: {
	message: string
	suggestion: string
	onSaved: () => void
}) {
	const save = useSaveGoalAnswer()
	const [goal, setGoal] = useState(suggestion)
	const [isMissing, setIsMissing] = useState(false)

	function submit() {
		const answer = goal.trim()
		setIsMissing(answer === '')
		if (answer !== '') save.mutate({ question: 'text', answer }, { onSuccess: onSaved })
	}

	return (
		<View style={styles.step}>
			<Text tone="danger" accessibilityRole="alert">
				{message}
			</Text>
			<TextField
				label={copy.setup.goal.questions.text}
				value={goal}
				onChangeText={setGoal}
				maxLength={MAX_GOAL_ANSWER_LENGTH}
				multiline
			/>
			<SaveError isMissing={isMissing} message={copy.setup.goal.errors.empty} error={save} />
			<Button label={copy.setup.plan.useSafer} isPending={save.isPending} onPress={submit} />
		</View>
	)
}

const styles = StyleSheet.create({
	step: { gap: space.md },
	feature: { fontFamily: fontFamily.textMedium },
	writing: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md }
})
