import { useState } from 'react'
import { randomUUID } from 'expo-crypto'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { PromiseChoice, RecallAnswer, ReportAnswer } from '@kept/contract'
import { api } from '@/lib/api'

// The Check-in's writes. Each one saved means Today has moved on, so it reads
// Today again, which says what comes next; nothing is guessed on the phone.

// Marking a recall answer is an AI call: up to 2 tries of 45s on the server.
const RECALL_TIMEOUT_MS = 100_000

export function useRefreshToday() {
	const queryClient = useQueryClient()
	// The Ledger is built from the same Reports and Promises.
	return () =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: ['today'] }),
			queryClient.invalidateQueries({ queryKey: ['ledger'] })
		])
}

/** An id made once per screen, so a retried write saves once (the server keys on it). */
export function useOnceId(): string {
	const [id] = useState(randomUUID)
	return id
}

export function useSubmitReport({ promiseId }: { promiseId: string }) {
	const reportId = useOnceId()
	const refreshToday = useRefreshToday()
	return useMutation({
		mutationFn: (answer: ReportAnswer) =>
			api('submitReport', { body: { promiseId, reportId, answer } }),
		onSuccess: refreshToday
	})
}

/** Not refreshed on success: the mark stays on screen until Continue. */
export function useAnswerRecall() {
	return useMutation({
		mutationFn: (body: RecallAnswer) => api('answerRecall', { body, timeoutMs: RECALL_TIMEOUT_MS })
	})
}

export function useFinishLesson() {
	const refreshToday = useRefreshToday()
	return useMutation({
		mutationFn: (keyIdeaId: string) => api('finishLesson', { body: { keyIdeaId } }),
		onSuccess: refreshToday
	})
}

export function useCommitPromise() {
	const refreshToday = useRefreshToday()
	return useMutation({
		mutationFn: (choice: PromiseChoice) => api('commitPromise', { body: choice }),
		onSuccess: refreshToday
	})
}

export function useChangePromise({ promiseId }: { promiseId: string }) {
	const changeId = useOnceId()
	const refreshToday = useRefreshToday()
	return useMutation({
		mutationFn: (choice: PromiseChoice) =>
			api('changePromise', { body: { promiseId, changeId, choice } }),
		onSuccess: refreshToday
	})
}
