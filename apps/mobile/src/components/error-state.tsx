import { View, StyleSheet } from 'react-native'
import { errorMessage } from '@/lib/api'
import { copy } from '@/copy'
import { space } from '@/lib/theme'
import { Button } from './ui/button'
import { Text } from './ui/text'

/** A failed load: the API's message, written for the person, and a way to try again. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
	return (
		<View style={styles.box} accessibilityRole="alert">
			<Text variant="lead">{errorMessage(error)}</Text>
			<Button label={copy.error.retry} variant="secondary" onPress={onRetry} />
		</View>
	)
}

const styles = StyleSheet.create({ box: { gap: space.md, paddingVertical: space.lg } })
