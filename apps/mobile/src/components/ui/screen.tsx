import type { ReactNode } from 'react'
import {
	KeyboardAvoidingView,
	Platform,
	RefreshControl,
	ScrollView,
	StyleSheet
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, space } from '@/lib/theme'

export function Screen({
	children,
	onRefresh,
	isRefreshing = false
}: {
	children: ReactNode
	onRefresh?: () => void
	isRefreshing?: boolean
}) {
	return (
		<SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
			{/* Typed answers sit low on the screen; the keyboard mustn't cover them. */}
			<KeyboardAvoidingView
				style={styles.fill}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<ScrollView
					contentContainerStyle={styles.content}
					keyboardShouldPersistTaps="handled"
					refreshControl={
						onRefresh == null ? undefined : (
							<RefreshControl
								refreshing={isRefreshing}
								onRefresh={onRefresh}
								tintColor={colors.accent}
							/>
						)
					}
				>
					{children}
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.bg },
	fill: { flex: 1 },
	content: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 }
})
