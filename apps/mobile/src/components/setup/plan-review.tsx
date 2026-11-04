import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { MAX_ACTION_LENGTH, type SetupView } from '@kept/contract'
import { copy } from '@/copy'
import { useBuildPlan, useConfirmPlan, useEditPlanAction } from '@/hooks/use-setup'
import { errorMessage } from '@/lib/api'
import { colors, fontFamily, space } from '@/lib/theme'
import { StepHeading } from '../check-in/step-heading'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Text } from '../ui/text'
import { TextField } from '../ui/text-field'

type Draft = Extract<Extract<SetupView, { step: 'plan' }>['plan'], { status: 'plan_made' }>['draft']
type Action = Draft['actions'][number]

const SIZES = ['small', 'medium', 'large'] as const

/** The plan the AI made: reword or remove actions, Try again once, then Confirm, which locks it. */
export function PlanReview({ draft, eyebrow }: { draft: Draft; eyebrow: string }) {
	const confirm = useConfirmPlan()
	const rebuild = useBuildPlan({ isRebuild: true })
	const isBusy = confirm.isPending || rebuild.isPending

	return (
		<View style={styles.step}>
			<StepHeading eyebrow={eyebrow} title={draft.goal.text ?? copy.setup.steps.plan} />
			<View style={styles.stats}>
				<Stat value={draft.goal.weeks ?? 0} label={copy.setup.plan.stats.weeks} />
				<Stat
					value={draft.actions.length}
					label={copy.setup.plan.stats.actions(draft.actions.length)}
				/>
				<Stat
					value={draft.keyIdeaCount}
					label={copy.setup.plan.stats.keyIdeas(draft.keyIdeaCount)}
				/>
			</View>

			<Text variant="lead" accessibilityRole="header">
				{copy.setup.plan.milestones}
			</Text>
			<Text tone="muted">{copy.setup.plan.milestonesHint}</Text>
			{draft.milestones.map((milestone) => (
				<Card key={milestone.id}>
					<Text variant="eyebrow" tone="muted">
						{copy.setup.plan.week(milestone.week)}
					</Text>
					<Text style={styles.strong}>{milestone.text}</Text>
				</Card>
			))}

			<Text variant="lead" accessibilityRole="header">
				{copy.setup.plan.actions}
			</Text>
			<Text tone="muted">{copy.setup.plan.actionsHint}</Text>
			{draft.actions.map((action) => (
				<ActionCard key={action.id} action={action} isLocked={isBusy} />
			))}

			{draft.canRebuild && (
				<Card>
					<Text style={styles.strong}>{copy.setup.plan.rebuild.label}</Text>
					<Text variant="small" tone="muted">
						{copy.setup.plan.rebuild.hint}
					</Text>
					{(rebuild.isError || rebuild.data?.kind === 'failed') && (
						<Text tone="danger" accessibilityRole="alert">
							{copy.setup.plan.rebuild.failed}
						</Text>
					)}
					<Button
						variant="secondary"
						label={
							rebuild.isPending ? copy.setup.plan.rebuild.pending : copy.setup.plan.rebuild.submit
						}
						isPending={rebuild.isPending}
						disabled={confirm.isPending}
						onPress={() => rebuild.mutate()}
					/>
				</Card>
			)}

			{confirm.isError && (
				<Text tone="danger" accessibilityRole="alert">
					{errorMessage(confirm.error)}
				</Text>
			)}
			<Button
				label={copy.setup.plan.confirm}
				isPending={confirm.isPending}
				disabled={rebuild.isPending}
				onPress={() => confirm.mutate()}
			/>
			<Text variant="small" tone="muted" style={styles.center}>
				{copy.setup.plan.confirmHint}
			</Text>
		</View>
	)
}

function Stat({ value, label }: { value: number; label: string }) {
	return (
		<Card style={styles.stat}>
			<Text variant="title">{String(value)}</Text>
			<Text variant="small" tone="muted">
				{label}
			</Text>
		</Card>
	)
}

function ActionCard({ action, isLocked }: { action: Action; isLocked: boolean }) {
	const [isEditing, setIsEditing] = useState(false)
	return (
		<Card>
			{isEditing ? (
				<ActionEditor action={action} onDone={() => setIsEditing(false)} />
			) : (
				<>
					{SIZES.map((size) => (
						<View key={size} style={styles.size}>
							<Text variant="small" tone="muted">
								{copy.setup.plan.edit.sizes[size]}
							</Text>
							<Text style={size === 'small' && styles.strong}>{action[size]}</Text>
						</View>
					))}
					<Button
						variant="quiet"
						label={copy.setup.plan.edit.open}
						disabled={isLocked}
						onPress={() => setIsEditing(true)}
					/>
				</>
			)}
		</Card>
	)
}

function ActionEditor({ action, onDone }: { action: Action; onDone: () => void }) {
	const edit = useEditPlanAction()
	const [sizes, setSizes] = useState({
		small: action.small,
		medium: action.medium,
		large: action.large
	})
	const [isEmpty, setIsEmpty] = useState(false)
	const isLast = edit.data?.result === 'last_action'

	function save() {
		const trimmed = {
			small: sizes.small.trim(),
			medium: sizes.medium.trim(),
			large: sizes.large.trim()
		}
		const empty = Object.values(trimmed).some((wording) => wording === '')
		setIsEmpty(empty)
		if (!empty) {
			edit.mutate({ intent: 'save', actionId: action.id, sizes: trimmed }, { onSuccess: onDone })
		}
	}

	return (
		<View style={styles.editor}>
			{SIZES.map((size) => (
				<TextField
					key={size}
					label={copy.setup.plan.edit.sizes[size]}
					value={sizes[size]}
					onChangeText={(wording) => setSizes((was) => ({ ...was, [size]: wording }))}
					maxLength={MAX_ACTION_LENGTH}
				/>
			))}
			{(isEmpty || isLast || edit.isError) && (
				<Text tone="danger" accessibilityRole="alert">
					{isEmpty
						? copy.setup.plan.edit.errors.empty
						: isLast
							? copy.setup.plan.edit.errors.lastAction
							: errorMessage(edit.error)}
				</Text>
			)}
			<Button label={copy.setup.plan.edit.save} isPending={edit.isPending} onPress={save} />
			<Button
				variant="quiet"
				label={copy.setup.plan.edit.remove}
				disabled={edit.isPending}
				onPress={() => edit.mutate({ intent: 'remove', actionId: action.id })}
			/>
			<Button variant="quiet" label={copy.setup.plan.edit.cancel} onPress={onDone} />
		</View>
	)
}

const styles = StyleSheet.create({
	step: { gap: space.md },
	stats: { flexDirection: 'row', gap: space.sm },
	stat: { flex: 1, padding: space.md },
	strong: { fontFamily: fontFamily.textBold },
	size: { gap: 2 },
	editor: { gap: space.sm },
	center: { textAlign: 'center', color: colors.textMuted }
})
