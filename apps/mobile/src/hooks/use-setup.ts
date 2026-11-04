import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { GoalAnswerInput, PlanActionEdit, PromiseChoice } from '@kept/contract'
import { api } from '@/lib/api'

// Setup's reads and writes. Each saved write means setup has moved on, so it
// reads setup (and who the person is) again; the server says what comes next.

// Writing a plan is an AI call; the server's limit is 200s (PLAN_BUILD_LIMIT_SECONDS).
const PLAN_TIMEOUT_MS = 200_000
// While another build is running, look again this often, as the web's wait does.
export const BUILD_POLL_MS = 3_000

export function useSetup({ isBuilding = false }: { isBuilding?: boolean } = {}) {
	return useQuery({
		queryKey: ['setup'],
		queryFn: ({ signal }) => api('getSetup', { signal }),
		refetchInterval: isBuilding ? BUILD_POLL_MS : false
	})
}

function useRefreshSetup() {
	const queryClient = useQueryClient()
	return () =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: ['setup'] }),
			queryClient.invalidateQueries({ queryKey: ['me'] })
		])
}

export function useSaveGoalAnswer() {
	const refresh = useRefreshSetup()
	return useMutation({
		mutationFn: (body: GoalAnswerInput) => api('saveGoalAnswer', { body }),
		onSuccess: refresh
	})
}

/** Refreshes only once the plan is saved: an unsafe or blocked goal stays on screen. */
export function useBuildPlan({ isRebuild }: { isRebuild: boolean }) {
	const refresh = useRefreshSetup()
	return useMutation({
		mutationFn: () =>
			isRebuild
				? api('rebuildPlan', { timeoutMs: PLAN_TIMEOUT_MS })
				: api('buildPlan', { timeoutMs: PLAN_TIMEOUT_MS }),
		onSuccess: async (result) => {
			if (result.kind === 'saved' || result.kind === 'skipped') await refresh()
		}
	})
}

export function useEditPlanAction() {
	const refresh = useRefreshSetup()
	return useMutation({
		mutationFn: (body: PlanActionEdit) => api('editPlanAction', { body }),
		onSuccess: async ({ result }) => {
			if (result !== 'last_action') await refresh()
		}
	})
}

export function useConfirmPlan() {
	const refresh = useRefreshSetup()
	return useMutation({ mutationFn: () => api('confirmPlan'), onSuccess: refresh })
}

export function useLearnFirstKeyIdea() {
	const refresh = useRefreshSetup()
	return useMutation({
		mutationFn: (keyIdeaId: string) => api('learnFirstKeyIdea', { body: { keyIdeaId } }),
		onSuccess: refresh
	})
}

export function useCommitFirstPromise() {
	const refresh = useRefreshSetup()
	return useMutation({
		mutationFn: (choice: PromiseChoice) => api('commitFirstPromise', { body: choice }),
		onSuccess: refresh
	})
}

export function useSaveReminder() {
	const refresh = useRefreshSetup()
	return useMutation({
		mutationFn: (time: string) => api('saveReminder', { body: { time } }),
		onSuccess: refresh
	})
}
