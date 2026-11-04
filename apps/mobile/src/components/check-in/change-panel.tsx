import { useState, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { space } from '@/lib/theme'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Text } from '../ui/text'

/** A closed panel that opens to change something saved today, until 4am. */
export function ChangePanel({
	summary,
	hint,
	children
}: {
	summary: string
	hint: string
	children: ReactNode
}) {
	const [isOpen, setIsOpen] = useState(false)
	return (
		<Card>
			<Button
				variant="quiet"
				label={summary}
				accessibilityState={{ expanded: isOpen }}
				onPress={() => setIsOpen((was) => !was)}
			/>
			{isOpen && (
				<View style={styles.body}>
					<Text variant="small" tone="muted">
						{hint}
					</Text>
					{children}
				</View>
			)}
		</Card>
	)
}

const styles = StyleSheet.create({ body: { gap: space.md } })
