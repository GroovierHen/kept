import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { space } from '@/lib/theme'
import { Text } from '../ui/text'

/** A step's eyebrow, title and lead, read as one heading. */
export function StepHeading({
	eyebrow,
	title,
	lead,
	children
}: {
	eyebrow?: string
	title: string
	lead?: string | null
	children?: ReactNode
}) {
	return (
		<View style={styles.heading}>
			{eyebrow != null && (
				<Text variant="eyebrow" tone="muted">
					{eyebrow}
				</Text>
			)}
			<Text variant="title" accessibilityRole="header">
				{title}
			</Text>
			{lead != null && <Text tone="muted">{lead}</Text>}
			{children}
		</View>
	)
}

const styles = StyleSheet.create({ heading: { gap: space.sm, paddingTop: space.sm } })
