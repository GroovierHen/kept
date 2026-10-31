import 'server-only'
import { getTranslations } from 'next-intl/server'
import { AppError } from '@/lib/errors/app-error'
import { isReportOpen, keptDayFromDate, promiseStatus, toKeptDay } from '@/lib/kept-day'
import { withRetry } from '@/lib/retry'
import type { ReportAnswer } from '@/lib/report'
import { db } from '@/server/db/client'
import { isTransientDbError, logDbRetry } from '@/server/db/transient-error'
import { recordEvent } from '@/server/events/record-event'

/**
 * Adds a Report with its Event in the same transaction (ADR 0001). `reportId`
 * makes a repeated submission save once (ADR 0002). A Promise that already has a
 * Report keeps it, so a stale second tab can't add another, until changing a
 * Report lands (#17).
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
						reports: { take: 1, select: { id: true } }
					}
				})
				if (promise == null) {
					throw new AppError(t('promiseGone'), { status: 404, code: 'promise_not_found' })
				}

				const today = toKeptDay({ instant: new Date(), timeZone: promise.user.timeZone })
				const promiseDay = keptDayFromDate(promise.promiseDay)
				if (promise.reports.length > 0) return
				if (!isReportOpen(promiseStatus({ promiseDay, today }))) {
					throw new AppError(t('closed'), { status: 409, code: 'report_closed' })
				}

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
