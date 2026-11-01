import 'server-only'
import { dayNumber, isReportEditable, keptDayFromDate, toKeptDay } from '@/lib/kept-day'
import type { Prisma } from '@/server/db/client'

// The latest two: once the next Promise is committed, the Report made today is on
// the one before it.
const PROMISES_READ = 2

/** Where the user's check-in stands right now, read inside `client`'s transaction if it has one. */
export async function readCheckIn({
	client,
	userId
}: {
	client: Prisma.TransactionClient
	userId: string
}) {
	const user = await client.user.findUniqueOrThrow({
		where: { id: userId },
		select: {
			timeZone: true,
			createdAt: true,
			promises: {
				orderBy: { promiseDay: 'desc' },
				take: PROMISES_READ,
				select: {
					id: true,
					promiseDay: true,
					planActionId: true,
					size: true,
					wording: true,
					moment: true,
					createdAt: true,
					reports: {
						orderBy: { createdAt: 'desc' },
						take: 1,
						select: { answer: true, createdAt: true }
					}
				}
			}
		}
	})
	const { timeZone } = user
	const today = toKeptDay({ instant: new Date(), timeZone })
	const signUpDay = toKeptDay({ instant: user.createdAt, timeZone })
	const promises = user.promises.map((promise) => {
		const [latestReport] = promise.reports
		return {
			...promise,
			promiseDay: keptDayFromDate(promise.promiseDay),
			committedOn: toKeptDay({ instant: promise.createdAt, timeZone }),
			reportedOn:
				latestReport == null ? null : toKeptDay({ instant: latestReport.createdAt, timeZone }),
			latestAnswer: latestReport?.answer ?? null
		}
	})
	const changeableReport = promises.find(
		({ reportedOn }) => reportedOn != null && isReportEditable({ reportedOn, today })
	)

	return {
		today,
		day: dayNumber({ signUpDay, today }),
		latestPromise: promises[0] ?? null,
		changeableReport: changeableReport ?? null
	}
}
