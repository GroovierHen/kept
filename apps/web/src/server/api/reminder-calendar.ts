import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { captureError } from '@/lib/observability/capture-error'
import { firstReminderDay, reminderIcs, reminderTime } from '@/lib/reminder'
import { getSignedInUser } from '@/server/auth/session'
import { readReminderDetails } from '@/server/setup/reminder-details'

// The .ics file for the reminder step. Not through createApiRoute, which only
// answers JSON. A real file with a calendar type is what makes a phone offer
// to add it.
export async function reminderCalendar(request: NextRequest): Promise<Response> {
	try {
		const user = await getSignedInUser()
		if (user == null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const time = reminderTime.safeParse(request.nextUrl.searchParams.get('time'))
		if (!time.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

		const details = await readReminderDetails(user.id)
		if (details == null) return NextResponse.json({ error: 'No promise yet' }, { status: 404 })

		const file = reminderIcs({
			uid: `daily-reminder-${user.id}@kept`,
			url: details.todayUrl,
			now: new Date(),
			startDay: firstReminderDay({ promiseDay: details.promiseDay, time: time.data }),
			time: time.data,
			timeZone: details.timeZone,
			title: details.title,
			details: details.details
		})
		return new Response(file, {
			headers: {
				'Content-Type': 'text/calendar; charset=utf-8',
				'Content-Disposition': 'attachment; filename="kept-reminder.ics"'
			}
		})
	} catch (error) {
		const { userMessage, status } = captureError(error)
		return NextResponse.json({ error: userMessage }, { status })
	}
}
