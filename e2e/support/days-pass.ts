import type { PrismaClient } from '@prisma/client'

const DAY_MS = 24 * 60 * 60 * 1000

const earlier = (date: Date, days: number) => new Date(date.getTime() - days * DAY_MS)

// Moves everything saved back in time, which is the same as the days passing.
export async function daysPass({
	db,
	email,
	days
}: {
	db: PrismaClient
	email: string
	days: number
}) {
	const user = await db.user.findFirstOrThrow({
		where: { email },
		// Oldest first, so no Promise lands on a Kept day another still holds.
		include: {
			promises: { orderBy: { promiseDay: 'asc' }, include: { reports: true } },
			events: true,
			reviews: true,
			plan: { include: { keyIdeas: { where: { taughtOn: { not: null } } } } }
		}
	})
	await db.$transaction([
		db.user.update({ where: { id: user.id }, data: { createdAt: earlier(user.createdAt, days) } }),
		...user.promises.map((promise) =>
			db.promise.update({
				where: { id: promise.id },
				data: {
					promiseDay: earlier(promise.promiseDay, days),
					createdAt: earlier(promise.createdAt, days)
				}
			})
		),
		...user.promises.flatMap((promise) =>
			promise.reports.map((report) =>
				db.report.update({
					where: { id: report.id },
					data: { createdAt: earlier(report.createdAt, days) }
				})
			)
		),
		...(user.plan?.keyIdeas ?? []).map((idea) =>
			db.keyIdea.update({
				where: { id: idea.id },
				data: { taughtOn: earlier(idea.taughtOn ?? new Date(), days) }
			})
		),
		...user.reviews.map((review) =>
			db.review.update({ where: { id: review.id }, data: { dueOn: earlier(review.dueOn, days) } })
		),
		...user.events.map((event) =>
			db.event.update({
				where: { id: event.id },
				data: { keptDay: earlier(event.keptDay, days), occurredAt: earlier(event.occurredAt, days) }
			})
		)
	])
}
