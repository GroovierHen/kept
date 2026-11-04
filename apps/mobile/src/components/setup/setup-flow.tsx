import { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import type { SetupStep } from '@kept/contract'
import { copy } from '@/copy'
import { useSetup } from '@/hooks/use-setup'
import { track } from '@/lib/analytics'
import { colors, space } from '@/lib/theme'
import { ErrorState } from '../error-state'
import { Screen } from '../ui/screen'
import { FirstPromiseStep, KeyIdeaStep, ReminderStep } from './first-steps'
import { GoalStep } from './goal-step'
import { PlanStep } from './plan-step'

/**
 * Setup, one step at a time, the first one not yet finished. Every saved step
 * reads setup again, so the next screen is the server's answer, never a guess.
 * Once it says done, who-is-signed-in refreshes and Today takes over.
 */
export function SetupFlow() {
	const setup = useSetup()
	const view = setup.data?.view
	const isBuilding =
		view?.step === 'plan' && view.plan.status === 'goal_saved' && view.plan.isBuilding
	// A build running elsewhere: look again every few seconds until it's saved.
	useSetup({ isBuilding })

	useEffect(() => track('page_viewed', { page: 'setup' }), [])

	if (setup.isPending) {
		return (
			<View style={styles.loading}>
				<ActivityIndicator color={colors.accent} />
			</View>
		)
	}
	if (setup.isError) {
		return (
			<Screen>
				<ErrorState error={setup.error} onRetry={() => void setup.refetch()} />
			</Screen>
		)
	}

	const { steps } = setup.data
	const eyebrowFor = (step: SetupStep) =>
		`${copy.setup.progress(steps.indexOf(step) + 1, steps.length)} · ${copy.setup.steps[step]}`

	return (
		<Screen onRefresh={() => void setup.refetch()} isRefreshing={setup.isRefetching}>
			<View style={styles.top}>
				{view?.step === 'goal' && <GoalStep view={view} eyebrow={eyebrowFor('goal')} />}
				{view?.step === 'plan' && <PlanStep plan={view.plan} eyebrow={eyebrowFor('plan')} />}
				{view?.step === 'keyIdea' && <KeyIdeaStep view={view} eyebrow={eyebrowFor('keyIdea')} />}
				{view?.step === 'promise' && (
					<FirstPromiseStep view={view} eyebrow={eyebrowFor('promise')} />
				)}
				{view?.step === 'reminder' && <ReminderStep eyebrow={eyebrowFor('reminder')} />}
			</View>
		</Screen>
	)
}

const styles = StyleSheet.create({
	loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
	top: { paddingTop: space.lg }
})
