import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import {
	MAX_RECALL_ANSWER_LENGTH,
	MAX_RECALL_SCORE,
	type RecallAnswer,
	type RecallResult
} from '@kept/contract'
import { copy } from '@/copy'
import { useAnswerRecall, useRefreshToday } from '@/hooks/use-check-in'
import { errorMessage } from '@/lib/api'
import { colors, fontFamily, radii, space } from '@/lib/theme'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { ChoiceTiles } from '../ui/choice-tiles'
import { Text } from '../ui/text'
import { TextField } from '../ui/text-field'
import { StepHeading } from './step-heading'

interface Recall {
	readonly keyIdeaId: string
	readonly title: string
	readonly question: string
	readonly choices: readonly string[]
}

/**
 * A key idea coming back: answered from memory and marked by the AI, then the
 * mark, the reason and the model answer. When the AI can't mark, the same
 * question comes back as multiple choice. Continue moves on to what's next.
 */
export function RecallStep({ recall }: { recall: Recall }) {
	const answer = useAnswerRecall()
	const refreshToday = useRefreshToday()
	const [typed, setTyped] = useState('')
	const [choice, setChoice] = useState<string | null>(null)
	const [isChoiceMissing, setIsChoiceMissing] = useState(false)
	// Once the AI couldn't mark, the card stays multiple choice, even after a failed send.
	const [isChoosing, setIsChoosing] = useState(false)
	const result: RecallResult | undefined = answer.data

	const send = (body: RecallAnswer) =>
		answer.mutate(body, {
			onSuccess: (sent) => {
				if (sent.kind === 'choosing') setIsChoosing(true)
				// No longer due (answered elsewhere): Today says what's next.
				if (sent.kind === 'moved_on') void refreshToday()
			}
		})

	const heading = (
		<StepHeading
			eyebrow={copy.recall.eyebrow(recall.title)}
			title={recall.question}
			lead={copy.recall.lead}
		/>
	)

	if (result?.kind === 'graded') {
		return (
			<View style={styles.step}>
				{heading}
				<Card>
					<View style={styles.score}>
						<View style={styles.pips} accessibilityElementsHidden>
							{Array.from({ length: MAX_RECALL_SCORE }, (_, index) => (
								<View key={index} style={[styles.pip, index < result.score && styles.pipOn]} />
							))}
						</View>
						<Text variant="title" accessibilityRole="summary">
							{copy.recall.score(result.score)}
						</Text>
					</View>
					<Text>
						{result.isMultipleChoice
							? result.score > 0
								? copy.recall.choiceRight
								: copy.recall.choiceWrong
							: result.reason}
					</Text>
					<View style={styles.model}>
						<Text variant="small" style={styles.modelLabel}>
							{copy.recall.modelAnswer}
						</Text>
						<Text>{result.modelAnswer}</Text>
					</View>
				</Card>
				<Button label={copy.recall.continue} onPress={() => void refreshToday()} />
			</View>
		)
	}

	function submit() {
		if (isChoosing) {
			setIsChoiceMissing(choice == null)
			if (choice != null) {
				send({ mode: 'choice', keyIdeaId: recall.keyIdeaId, choice: Number(choice) })
			}
			return
		}
		send({ mode: 'typed', keyIdeaId: recall.keyIdeaId, answer: typed })
	}

	return (
		<View style={styles.step}>
			{heading}
			{isChoosing ? (
				<>
					<Text tone="muted">{copy.recall.choosingHint}</Text>
					<ChoiceTiles
						label={recall.question}
						choices={recall.choices.map((label, index) => ({ value: String(index), label }))}
						value={choice}
						onChange={setChoice}
						disabled={answer.isPending}
					/>
				</>
			) : (
				<TextField
					label={copy.recall.answerLabel}
					placeholder={copy.recall.placeholder}
					value={typed}
					onChangeText={setTyped}
					maxLength={MAX_RECALL_ANSWER_LENGTH}
					multiline
					editable={!answer.isPending}
				/>
			)}
			{(answer.isError || isChoiceMissing) && (
				<Text tone="danger" accessibilityRole="alert">
					{isChoiceMissing ? copy.recall.errors.choose : errorMessage(answer.error)}
				</Text>
			)}
			<Button
				label={answer.isPending ? copy.recall.marking : copy.recall.submit}
				isPending={answer.isPending}
				onPress={submit}
			/>
		</View>
	)
}

const PIP = 22

const styles = StyleSheet.create({
	step: { gap: space.md },
	score: { flexDirection: 'row', alignItems: 'center', gap: space.md },
	pips: { flexDirection: 'row', gap: 6 },
	pip: {
		width: PIP,
		height: PIP,
		borderRadius: PIP / 2,
		borderWidth: 2,
		borderColor: colors.accent
	},
	pipOn: { backgroundColor: colors.accent },
	model: { backgroundColor: colors.accentSoft, borderRadius: radii.md, padding: space.md, gap: 4 },
	modelLabel: { color: colors.accent, fontFamily: fontFamily.textBold }
})
