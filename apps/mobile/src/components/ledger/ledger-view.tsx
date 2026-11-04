import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import type { LedgerResponse } from '@kept/contract'
import { copy } from '@/copy'
import { track } from '@/lib/analytics'
import { colors, fontFamily, radii, space } from '@/lib/theme'
import { Card } from '../ui/card'
import { Text } from '../ui/text'
import { DayByDay } from './day-by-day'

const OUTCOMES = ['kept', 'partly', 'slipped'] as const
const WEEK_DAYS = 7
const BAR = 14

/** What the person has kept, built from their Events: the web's Ledger, one column. */
export function LedgerView({ ledger }: { ledger: LedgerResponse }) {
	useEffect(() => track('page_viewed', { page: 'ledger' }), [])
	const { week, milestone, learned, streak } = ledger

	return (
		<>
			<View style={styles.header}>
				<Text variant="eyebrow" tone="muted">
					{copy.ledger.eyebrow(ledger.day, ledger.goal.text)}
				</Text>
				<Text variant="title" accessibilityRole="header">
					{copy.ledger.title}
				</Text>
				<Text tone="muted">{copy.ledger.lead}</Text>
			</View>

			<Section title={copy.ledger.promises.title}>
				<View style={styles.counts}>
					{OUTCOMES.map((outcome) => {
						const days = ledger.promises[outcome]
						const isKept = outcome === 'kept'
						return (
							<Card key={outcome} style={[styles.count, isKept && styles.kept]}>
								<Text variant="small" style={[styles.strong, isKept && styles.onAccent]}>
									{copy.ledger.promises[outcome]}
								</Text>
								<Text variant="head" style={isKept && styles.onAccent}>
									{String(days.length)}
								</Text>
								{days.length > 0 && (
									<Text variant="small" style={isKept ? styles.onAccent : styles.muted}>
										{copy.ledger.promises.days(days)}
									</Text>
								)}
							</Card>
						)
					})}
				</View>
				<Text variant="small" tone="muted">
					{copy.ledger.promises.note}
				</Text>
			</Section>

			<Card>
				<Text style={styles.strong}>{copy.ledger.days.title}</Text>
				<Text variant="small" tone="muted">
					{copy.ledger.days.hint}
				</Text>
				<DayByDay days={ledger.days} />
			</Card>

			{ledger.sizeChanges.length > 0 && (
				<Section title={copy.ledger.sizes.title}>
					{ledger.sizeChanges.map((change) => (
						<Card key={`${change.wording}-${change.day}`}>
							<Text variant="small" tone="muted">
								{change.direction === 'bigger'
									? copy.ledger.sizes.bigger
									: copy.ledger.sizes.smaller}
							</Text>
							<Text style={styles.strong}>{change.wording}</Text>
							<Text variant="small" tone="muted">
								{copy.ledger.sizes.change(change.from, change.to, change.day)}
							</Text>
						</Card>
					))}
					{ledger.sizeChanges.some(({ direction }) => direction === 'smaller') && (
						<Text variant="small" tone="muted">
							{copy.ledger.sizes.smallerNote}
						</Text>
					)}
				</Section>
			)}

			<Section title={copy.ledger.learned.title}>
				{learned.ideas.map((idea) => (
					<Card key={idea.keyIdeaId}>
						<Text style={styles.strong}>{idea.title}</Text>
						<Text variant="small" tone="muted">
							{copy.ledger.learned.scores(
								idea.first.score,
								idea.first.day,
								idea.last.score,
								idea.last.day
							)}
						</Text>
					</Card>
				))}
				{learned.ideas.length === 0 && learned.leftOut === 0 && (
					<Text tone="muted">{copy.ledger.learned.none}</Text>
				)}
				{learned.leftOut > 0 && (
					<Text variant="small" tone="muted">
						{copy.ledger.learned.leftOut(learned.leftOut)}
					</Text>
				)}
			</Section>

			<Card tone="night">
				<Text variant="eyebrow" tone="nightMuted">
					{copy.ledger.week.label}
				</Text>
				<Text variant="lead" tone="nightInk">
					{week.total === 0 ? copy.today.week.none : copy.today.week.kept(week.kept, week.total)}
				</Text>
				{week.total > 0 && (
					<>
						<View style={styles.bar} accessibilityElementsHidden>
							<View style={[styles.fill, { width: `${(week.kept / week.total) * 100}%` }]} />
						</View>
						<Text variant="small" tone="nightMuted">
							{copy.ledger.week.lead}
						</Text>
					</>
				)}
			</Card>

			{milestone != null && (
				<Card>
					<Text variant="small" tone="muted">
						{copy.ledger.milestone.heading(milestone.week)}
					</Text>
					<Text variant="lead">{milestone.text}</Text>
					<Text variant="small" tone="muted">
						{copy.today.milestone.due(milestone.daysLeft)}
					</Text>
					{ledger.milestones.map(({ id, week: due, text }) => (
						<Text
							key={id}
							variant="small"
							tone={due === milestone.week ? 'default' : 'muted'}
							style={due === milestone.week && styles.strong}
						>
							{`${copy.ledger.milestone.week(due)} · ${text}`}
						</Text>
					))}
				</Card>
			)}

			<View style={styles.counts}>
				<Card style={styles.count}>
					<Text variant="small" tone="muted">
						{copy.ledger.stats.daysIn}
					</Text>
					<Text variant="title">{String(ledger.day)}</Text>
					<Text variant="small" tone="muted">
						{copy.ledger.stats.daysOf(ledger.goal.weeks * WEEK_DAYS)}
					</Text>
				</Card>
				<Card style={styles.count}>
					<Text variant="small" tone="muted">
						{copy.ledger.stats.recalled}
					</Text>
					<Text variant="title">{String(learned.ideas.length)}</Text>
					<Text variant="small" tone="muted">
						{copy.ledger.stats.recalledOf}
					</Text>
				</Card>
			</View>
			<View style={styles.counts}>
				<Card style={styles.count}>
					<Text variant="small" tone="muted">
						{copy.ledger.stats.streak}
					</Text>
					{/* A Streak that ended is never shown as lost (ADR 0004). */}
					<Text variant="title">{String(streak.days > 0 ? streak.days : streak.best)}</Text>
					<Text variant="small" tone="muted">
						{streak.days > 0
							? copy.ledger.stats.streakBest(streak.best)
							: copy.ledger.stats.streakBestOnly}
					</Text>
				</Card>
				<Card style={styles.count}>
					<Text variant="small" tone="muted">
						{copy.ledger.stats.comebacks}
					</Text>
					<Text variant="title">{String(streak.comebacks)}</Text>
					<Text variant="small" tone="muted">
						{copy.ledger.stats.comebacksOf}
					</Text>
				</Card>
			</View>
		</>
	)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<View style={styles.section}>
			<Text style={styles.strong} accessibilityRole="header">
				{title}
			</Text>
			{children}
		</View>
	)
}

const styles = StyleSheet.create({
	header: { gap: space.sm, paddingTop: space.lg },
	section: { gap: space.sm },
	counts: { flexDirection: 'row', gap: space.sm },
	count: { flex: 1, padding: space.md },
	kept: { backgroundColor: colors.accent, borderColor: colors.accent },
	onAccent: { color: colors.accentInk },
	muted: { color: colors.textMuted },
	strong: { fontFamily: fontFamily.textBold },
	bar: {
		height: BAR,
		borderRadius: radii.sm,
		backgroundColor: colors.nightSurface,
		overflow: 'hidden'
	},
	fill: { height: '100%', backgroundColor: colors.coral, borderRadius: radii.sm }
})
