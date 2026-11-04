import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import type { UseQueryResult } from '@tanstack/react-query'
import type { TodayResponse } from '@kept/contract'
import { copy } from '@/copy'
import { track } from '@/lib/analytics'
import { ApiError } from '@/lib/api'
import { space } from '@/lib/theme'
import { CheckIn } from './check-in/check-in'
import { ErrorState } from './error-state'
import { SignOutButton } from './sign-out-button'
import { ReminderCard } from './reminder-card'
import { Card } from './ui/card'
import { Screen } from './ui/screen'
import { Text } from './ui/text'
import { WeekStrip } from './week-strip'

/**
 * Today: the check-in, one step at a time, then the Promise it is about, the
 * week and the next milestone.
 */
export function TodayView({
	today,
	reminderTime,
	onRefresh
}: {
	today: UseQueryResult<TodayResponse>
	reminderTime: string | null
	onRefresh: () => void
}) {
	useEffect(() => track('page_viewed', { page: 'today' }), [])
	useEffect(() => {
		if (today.error != null) {
			track('error_shown', {
				page: 'today',
				error_type: today.error instanceof ApiError ? today.error.code : 'unknown'
			})
		}
	}, [today.error])

	return (
		<Screen onRefresh={onRefresh} isRefreshing={today.isRefetching}>
			{today.isError && <ErrorState error={today.error} onRetry={onRefresh} />}
			{today.data != null && <TodayContent today={today.data} />}
			{reminderTime != null && <ReminderCard time={reminderTime} />}
			<SignOutButton />
		</Screen>
	)
}

function TodayContent({ today }: { today: TodayResponse }) {
	const { step, promise, milestone, streak } = today
	return (
		<>
			<View style={styles.header}>
				<Text variant="eyebrow" tone="muted">
					{copy.today.day(today.day)}
				</Text>
			</View>

			<CheckIn today={today} />

			{promise != null && step === 'done' && (
				<Card tone="night">
					<Text variant="eyebrow" tone="nightMuted">
						{copy.today.promiseLabel[promise.status]}
					</Text>
					<Text variant="lead" tone="nightInk">
						{promise.wording}
					</Text>
					{promise.moment != null && (
						<Text variant="small" tone="nightMuted">
							{copy.today.moments[promise.moment]}
						</Text>
					)}
				</Card>
			)}

			<Card>
				<WeekStrip strip={today.strip} week={today.week} />
			</Card>

			{/* Hidden at 0, so a Streak that ended never shows as lost (ADR 0004). */}
			{streak.days > 0 && (
				<Card>
					<Text variant="eyebrow" tone="muted">
						{copy.today.streak.heading}
					</Text>
					<Text variant="lead">{copy.today.streak.days(streak.days)}</Text>
					<Text tone="muted">
						{streak.isForgivenessReady ? copy.today.streak.safe : copy.today.streak.notSafe}
					</Text>
				</Card>
			)}

			{milestone != null && (
				<Card>
					<Text variant="eyebrow" tone="muted">
						{copy.today.milestone.heading}
					</Text>
					<Text variant="lead">{milestone.text}</Text>
					<Text tone="muted">{copy.today.milestone.due(milestone.daysLeft)}</Text>
				</Card>
			)}
		</>
	)
}

const styles = StyleSheet.create({
	header: { paddingTop: space.lg }
})
