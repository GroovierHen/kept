import 'server-only'
import { getTranslations } from 'next-intl/server'
import { AppError } from '@/lib/errors/app-error'
import { canReport } from '@/lib/check-in'
import { keptDayFromDate, toKeptDay } from '@/lib/kept-day'
import { withRetry } from '@/lib/retry'
import type { ReportAnswer } from '@/lib/report'
import { db } from '@/server/db/client'
import { isTransientDbError, logDbRetry } from '@/server/db/transient-error'
import { recordEvent } from '@/server/events/record-event'

/**
 * Adds a Report with its Event in the same transaction (ADR 0001). `reportId`
 * makes a repeated submission save once (ADR 0002), even after the 4am that
 * would refuse a new one. Changing a Report adds another row with its own Event,
 * and the latest counts; the same answer again adds nothing. A committed Promise
 * is never touched here.
 */
export async function makeReport({
	userId,
	promiseId,
	reportId,
	answer
}: {
	userId: string
	promiseId: string
	reportId: string
	answer: ReportAnswer
}): Promise<void> {
	const t = await getTranslations('TodayPage.report.errors')
	return withRetry(
		() =>
			db.$transaction(async (tx) => {
				const promise = await tx.promise.findFirst({
					where: { id: promiseId, userId },
					select: {
						promiseDay: true,
						user: { select: { timeZone: true } },
						reports: {
							orderBy: { createdAt: 'desc' },
							select: { id: true, answer: true, createdAt: true }
						}
					}
				})
				if (promise == null) {
					throw new AppError(t('promiseGone'), { status: 404, code: 'promise_not_found' })
				}

				if (promise.reports.some(({ id }) => id === reportId)) return

				const { timeZone } = promise.user
				const today = toKeptDay({ instant: new Date(), timeZone })
				const promiseDay = keptDayFromDate(promise.promiseDay)
				const [latest] = promise.reports
				const reportedOn =
					latest == null ? null : toKeptDay({ instant: latest.createdAt, timeZone })
				if (!canReport({ promiseDay, reportedOn, today })) {
					throw new AppError(t(reportedOn == null ? 'closed' : 'changeClosed'), {
						status: 409,
						code: 'report_closed'
					})
				}
				if (latest?.answer === answer) return

				const { count } = await tx.report.createMany({
					data: [{ id: reportId, promiseId, answer }],
					skipDuplicates: true
				})
				if (count === 0) return
				await recordEvent({
					tx,
					event: {
						userId,
						name: 'report_made',
						keptDay: today,
						details: { promiseId, promiseDay, answer },
						idempotencyKey: `report_made:${reportId}`
					}
				})
			}),
		{ isRetryable: isTransientDbError, onRetry: logDbRetry }
	)
}
