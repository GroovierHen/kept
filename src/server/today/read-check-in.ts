import 'server-only'
import { dayNumber, keptDayFromDate, toKeptDay } from '@/lib/kept-day'
import type { Prisma } from '@/server/db/client'

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
				take: 1,
				select: {
					id: true,
					promiseDay: true,
					planActionId: true,
					wording: true,
					moment: true,
					createdAt: true,
					reports: { orderBy: { createdAt: 'desc' }, take: 1, select: { answer: true } }
				}
			}
		}
	})
	const { timeZone } = user
	const today = toKeptDay({ instant: new Date(), timeZone })
	const signUpDay = toKeptDay({ instant: user.createdAt, timeZone })
	const [promise] = user.promises
	const latestPromise =
		promise == null
			? null
			: {
					...promise,
					promiseDay: keptDayFromDate(promise.promiseDay),
					committedOn: toKeptDay({ instant: promise.createdAt, timeZone }),
					hasReport: promise.reports.length > 0,
					latestAnswer: promise.reports[0]?.answer ?? null
				}

	return { today, day: dayNumber({ signUpDay, today }), latestPromise }
}
