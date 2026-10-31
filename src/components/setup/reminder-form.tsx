'use client'

import { useId, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from '@/i18n/routing'
import {
	DEFAULT_REMINDER_TIME,
	firstReminderDay,
	googleCalendarUrl,
	reminderTime
} from '@/lib/reminder'
import { saveReminder } from '@/server/actions/setup'
import type { ReminderDetails } from '@/server/setup/reminder-details'

const ADD_BUTTON_CLASS = 'text-body h-12 w-full'

// Both ways to add are links, so the calendar opens from the tap itself and no
// popup blocker gets involved. The tap also saves the step, and the user stays
// here until they choose to move on, because the calendar may have taken over
// the screen.
export function ReminderForm({ details }: { details: ReminderDetails }) {
	const t = useTranslations('SetupPage.reminder')
	const id = useId()
	const [time, setTime] = useState(DEFAULT_REMINDER_TIME)
	const [isSaved, setIsSaved] = useState(false)
	const [hasFailed, setHasFailed] = useState(false)
	const [, startSaving] = useTransition()
	const isValidTime = reminderTime.safeParse(time).success

	if (isSaved) {
		return (
			<div className="flex flex-col gap-4">
				<p role="status" className="text-body">
					{t('added')}
				</p>
				<p className="text-small text-text-muted">{t('changeLater')}</p>
				<Button asChild size="lg" className={ADD_BUTTON_CLASS}>
					<Link href="/today">{t('goToToday')}</Link>
				</Button>
			</div>
		)
	}

	const save = () => {
		setHasFailed(false)
		startSaving(async () => {
			try {
				const { ok } = await saveReminder(time)
				setIsSaved(ok)
				setHasFailed(!ok)
			} catch {
				setHasFailed(true)
			}
		})
	}

	return (
		<div className="flex flex-col gap-4">
			<p className="text-body">{t('body')}</p>
			<div className="flex flex-col gap-2">
				<Label htmlFor={`${id}-time`}>{t('timeLabel')}</Label>
				<Input
					id={`${id}-time`}
					type="time"
					value={time}
					onChange={(event) => setTime(event.target.value)}
					className="text-body h-12"
				/>
			</div>
			<p className="text-small text-text-muted">{t('changeLater')}</p>

			<p role="alert" className="text-body text-danger empty:hidden">
				{hasFailed ? t('saveFailed') : null}
			</p>

			{isValidTime ? (
				<>
					<Button asChild size="lg" className={ADD_BUTTON_CLASS}>
						<a href={`/api/reminder?time=${encodeURIComponent(time)}`} onClick={save}>
							{t('addFile')}
						</a>
					</Button>
					<Button asChild size="lg" variant="outline" className={ADD_BUTTON_CLASS}>
						<a
							href={googleCalendarUrl({
								startDay: firstReminderDay({ promiseDay: details.promiseDay, time }),
								time,
								timeZone: details.timeZone,
								title: details.title,
								details: details.details
							})}
							target="_blank"
							rel="noopener noreferrer"
							onClick={save}
						>
							{t('addGoogle')}
						</a>
					</Button>
				</>
			) : (
				<p className="text-small text-text-muted">{t('pickTime')}</p>
			)}
		</div>
	)
}
