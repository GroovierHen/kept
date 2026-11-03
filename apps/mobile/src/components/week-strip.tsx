import { StyleSheet, View } from 'react-native'
import type { TodayResponse } from '@kept/contract'
import { copy } from '@/copy'
import { colors, radii, space } from '@/lib/theme'
import { Text } from './ui/text'

type Outcome = TodayResponse['strip'][number]['outcome']

const FILL: Record<Outcome, string> = {
	kept: colors.kept,
	partly: colors.partly,
	slipped: colors.slipped,
	open: colors.surface,
	unreported: colors.surfaceHover,
	noPromise: colors.bg
}

/** The last seven days, a square each; every square says its outcome to a screen reader. */
export function WeekStrip({ strip, week }: Pick<TodayResponse, 'strip' | 'week'>) {
	return (
		<View style={styles.box}>
			<Text variant="eyebrow" tone="muted">
				{copy.today.week.heading}
			</Text>
			<View style={styles.row}>
				{strip.map(({ day, outcome }) => (
					<View
						key={day}
						style={styles.day}
						accessible
						accessibilityLabel={`${copy.today.day(day)}: ${copy.today.week.outcomes[outcome]}`}
					>
						<View style={[styles.square, { backgroundColor: FILL[outcome] }]} />
						<Text variant="small" tone="muted">
							{day}
						</Text>
					</View>
				))}
			</View>
			<Text tone="muted">
				{week.total === 0 ? copy.today.week.none : copy.today.week.kept(week.kept, week.total)}
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	box: { gap: space.sm },
	row: { flexDirection: 'row', gap: space.sm },
	day: { alignItems: 'center', gap: space.xs, flex: 1 },
	square: {
		width: '100%',
		aspectRatio: 1,
		borderRadius: radii.sm,
		borderWidth: 1,
		borderColor: colors.borderStrong
	}
})
