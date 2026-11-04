import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import {
	MAX_PROMISE_LENGTH,
	PROMISE_MOMENTS,
	type PromiseChoice,
	type PromiseMoment
} from '@kept/contract'
import { copy } from '@/copy'
import { fontFamily, space } from '@/lib/theme'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { ChoiceTiles } from '../ui/choice-tiles'
import { Text } from '../ui/text'
import { TextField } from '../ui/text-field'

export interface PickerAction {
	readonly id: string
	readonly wording: string
}

export interface PickerSelection {
	readonly moment: PromiseMoment
	readonly actionId: string | null
	readonly typed: string | null
}

const MOMENT_CHOICES = PROMISE_MOMENTS.map((moment) => ({
	value: moment,
	label: copy.promise.moments[moment]
}))

/**
 * One small thing, at one moment: an action from the plan or the person's own
 * words, with the sentence it makes read back before it's promised. Used to
 * commit the next Promise, to change today's, and for setup's first.
 */
export function PromisePicker({
	actions,
	initial,
	submitLabel = copy.promise.commit,
	onSubmit,
	isPending,
	error
}: {
	actions: readonly PickerAction[]
	initial: PickerSelection | null
	submitLabel?: string
	onSubmit: (choice: PromiseChoice) => void
	isPending: boolean
	error: string | null
}) {
	const [actionId, setActionId] = useState(initial?.actionId ?? actions[0]?.id ?? null)
	const [isTyping, setIsTyping] = useState(actions.length === 0 || initial?.typed != null)
	const [typed, setTyped] = useState(initial?.typed ?? '')
	const [moment, setMoment] = useState<PromiseMoment | null>(initial?.moment ?? null)
	const [isInvalid, setIsInvalid] = useState(false)

	const chosen = actions.find((action) => action.id === actionId)?.wording
	const wording = isTyping ? typed.trim() : chosen
	const sentence =
		moment != null && wording != null && wording !== ''
			? copy.promise.sentences[moment](wording)
			: null

	function submit() {
		const choice = choiceOf({ isTyping, typed, actionId, moment })
		setIsInvalid(choice == null)
		if (choice != null) onSubmit(choice)
	}

	return (
		<View style={styles.form}>
			{isTyping ? (
				<TextField
					label={copy.promise.typedLabel}
					placeholder={copy.promise.typedPlaceholder}
					value={typed}
					onChangeText={setTyped}
					maxLength={MAX_PROMISE_LENGTH}
					multiline
				/>
			) : (
				<ChoiceTiles
					label={copy.promise.actionsLabel}
					choices={actions.map(({ id, wording: label }) => ({ value: id, label }))}
					value={actionId}
					onChange={setActionId}
				/>
			)}
			{actions.length > 0 && (
				<Button
					variant="quiet"
					label={isTyping ? copy.promise.useAction : copy.promise.typeMyOwn}
					onPress={() => setIsTyping((was) => !was)}
				/>
			)}

			<Text variant="small" style={styles.label}>
				{copy.promise.momentLabel}
			</Text>
			<ChoiceTiles
				label={copy.promise.momentLabel}
				choices={MOMENT_CHOICES}
				value={moment}
				onChange={setMoment}
			/>

			<Card tone="night">
				<Text variant="lead" tone="nightInk" accessibilityLiveRegion="polite">
					{sentence ?? copy.promise.empty}
				</Text>
			</Card>

			{(isInvalid || error != null) && (
				<Text tone="danger" accessibilityRole="alert">
					{isInvalid ? copy.promise.errors.invalid : error}
				</Text>
			)}
			<Button label={submitLabel} isPending={isPending} onPress={submit} />
		</View>
	)
}

/** What the server would accept, or null; it parses the same schema again. */
export function choiceOf({
	isTyping,
	typed,
	actionId,
	moment
}: {
	isTyping: boolean
	typed: string
	actionId: string | null
	moment: PromiseMoment | null
}): PromiseChoice | null {
	if (moment == null) return null
	if (isTyping) {
		const wording = typed.trim()
		return wording === '' || wording.length > MAX_PROMISE_LENGTH
			? null
			: { kind: 'typed', moment, wording }
	}
	return actionId == null ? null : { kind: 'action', moment, actionId }
}

const styles = StyleSheet.create({
	form: { gap: space.md },
	label: { fontFamily: fontFamily.textBold }
})
