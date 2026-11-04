import { StyleSheet, View } from 'react-native'
import { copy } from '@/copy'
import { useFinishLesson } from '@/hooks/use-check-in'
import { errorMessage } from '@/lib/api'
import { space } from '@/lib/theme'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Text } from '../ui/text'

interface Lesson {
	readonly keyIdeaId: string
	readonly title: string
	readonly lesson: string
}

/** Today's key idea. Continue means it was read, so it counts as taught. */
export function LessonStep({ lesson }: { lesson: Lesson }) {
	const finish = useFinishLesson()
	return (
		<View style={styles.step}>
			<LessonCard lesson={lesson} eyebrow={copy.lesson.eyebrow} />
			{finish.isError && (
				<Text tone="danger" accessibilityRole="alert">
					{errorMessage(finish.error)}
				</Text>
			)}
			<Button
				label={copy.lesson.continue}
				isPending={finish.isPending}
				onPress={() => finish.mutate(lesson.keyIdeaId)}
			/>
		</View>
	)
}

export function LessonCard({ lesson, eyebrow }: { lesson: Lesson; eyebrow: string }) {
	return (
		<Card>
			<Text variant="eyebrow" tone="muted">
				{eyebrow}
			</Text>
			<Text variant="title" accessibilityRole="header">
				{lesson.title}
			</Text>
			<Text>{lesson.lesson}</Text>
		</Card>
	)
}

const styles = StyleSheet.create({ step: { gap: space.md } })
