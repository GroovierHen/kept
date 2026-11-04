import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import type { LedgerResponse } from '@kept/contract'
import { copy } from '@/copy'
import { colors, fontFamily, radii, space } from '@/lib/theme'
import { Text } from '../ui/text'

type Day = LedgerResponse['days'][number]
type Outcome = Day['outcome']

const FILL: Record<Outcome, string> = {
	kept: colors.kept,
	partly: colors.partly,
	slipped: colors.slipped,
	open: colors.surface,
	unreported: colors.surfaceHover,
	noPromise: colors.bg
}

const CELL = 40

/** Every day since sign-up; tapping one shows its Promise and what became of it. */
export function DayByDay({ days }: { days: LedgerResponse['days'] }) {
	const [picked, setPicked] = useState<number | null>(days.at(-1)?.day ?? null)
	const day = days.find((candidate) => candidate.day === picked)
	return (
		<View style={styles.box}>
			<View style={styles.grid}>
				{days.map(({ day: number, outcome }) => {
					const label = `${copy.ledger.days.day(number)}: ${copy.ledger.days.outcomes[outcome]}`
					const isPicked = number === picked
					return (
						<Pressable
							key={number}
							accessibilityRole="button"
							accessibilityLabel={label}
							accessibilityState={{ selected: isPicked }}
							onPress={() => setPicked(number)}
							style={[styles.cell, { backgroundColor: FILL[outcome] }, isPicked && styles.picked]}
						>
							<Text variant="small" style={styles.number}>
								{String(number)}
							</Text>
						</Pressable>
					)
				})}
			</View>
			{day != null && (
				<View style={styles.detail} accessibilityLiveRegion="polite">
					<Text variant="small" tone="muted">
						{`${copy.ledger.days.day(day.day)} · ${copy.ledger.days.outcomes[day.outcome]}`}
					</Text>
					<Text>
						{day.promise == null
							? copy.ledger.days.none
							: copy.promise.sentences[day.promise.moment](day.promise.wording)}
					</Text>
				</View>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	box: { gap: space.md },
	grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
	cell: {
		width: CELL,
		height: CELL,
		borderRadius: radii.sm,
		borderWidth: 1,
		borderColor: colors.border,
		alignItems: 'center',
		justifyContent: 'center'
	},
	picked: { borderColor: colors.accent, borderWidth: 2 },
	number: { fontFamily: fontFamily.textBold },
	detail: { gap: space.xs }
})
