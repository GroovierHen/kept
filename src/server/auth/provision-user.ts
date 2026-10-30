import 'server-only'
import { db } from '@/server/db/client'
import { log } from '@/server/lib/logger'
import { recordEvent } from '@/server/events/record-event'
import { toKeptDay } from '@/lib/kept-day'
import { seatRoleForEmail } from '@/lib/rbac/staff-bootstrap'

// Idempotent user provisioning — call on sign-up and sign-in with the Supabase
// auth uuid + email + time zone. It (1) creates or refreshes the User row
// with id = the Supabase auth uuid (docs/rules/auth.md — never app-generated),
// and (2) if the email's domain maps to a staff seat (src/lib/rbac/staff-bootstrap),
// creates an AdminMember at that role. seatRoleForEmail returns the LOWEST role
// for a domain listed in ADMIN_EMAIL_DOMAINS and null for everyone else, so a
// non-staff user gets a User row and no seat. An existing seat is never downgraded here — (re)seating or
// elevation is a deliberate access.manage action, not a side effect of signing in.
//
// The row and its "signed up" Event are saved together, once: the insert skips an
// existing row, so concurrent sign-ins can't record it twice, and a later sign-in
// never touches the time zone. `timeZone` must already be resolved (resolveTimeZone).
export async function provisionUser({
	id,
	email,
	timeZone
}: {
	id: string
	email: string
	timeZone: string
}): Promise<void> {
	await db.$transaction(async (tx) => {
		const { count } = await tx.user.createMany({
			data: [{ id, email, timeZone }],
			skipDuplicates: true
		})
		if (count === 0) {
			await tx.user.update({ where: { id }, data: { email } })
			return
		}
		await recordEvent({
			tx,
			event: {
				userId: id,
				name: 'signed_up',
				keptDay: toKeptDay({ instant: new Date(), timeZone }),
				details: {}
			}
		})
	})

	const seatRole = seatRoleForEmail(email)
	if (!seatRole) return

	await db.adminMember.upsert({
		where: { userId: id },
		create: { userId: id, role: seatRole },
		update: {}
	})
	log.info('provisioned admin seat', { userId: id, role: seatRole })
}
