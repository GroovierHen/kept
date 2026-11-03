'use client'

import { useId, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon, CalendarIcon, SuccessIcon } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import {
	DEFAULT_REMINDER_TIME,
	firstReminderDay,
	googleCalendarUrl,
	reminderTime
} from '@/lib/reminder'
import { saveReminder } from '@/server/actions/setup'
import type { ReminderDetails } from '@/server/setup/reminder-details'
import { AsideCard, SetupAside, SetupMain } from './setup-layout'
import { SETUP_BUTTON } from './setup-styles'

// Both ways to add are links, so the calendar opens from the tap itself and no
// popup blocker gets involved. The tap also saves the step, and the user stays
// here until they choose to move on, because the calendar may have taken over
// the screen. The green panel shows the event as the calendar will.
export function ReminderForm({
	details,
	heading
}: {
	details: ReminderDetails
	heading: React.ReactNode
}) {
	const t = useTranslations('SetupPage.reminder')
	const id = useId()
	const [time, setTime] = useState(DEFAULT_REMINDER_TIME)
	const [isSaved, setIsSaved] = useState(false)
	const [hasFailed, setHasFailed] = useState(false)
	const [, startSaving] = useTransition()
	const isValidTime = reminderTime.safeParse(time).success

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
		<>
			<SetupMain>
				{heading}
				{isSaved ? (
					<div className="flex flex-col gap-4">
						<p role="status" className="flex items-start gap-3 text-[17px] leading-[1.55]">
							<SuccessIcon size={24} className="text-success mt-0.5 flex-none" />
							{t('added')}
						</p>
						<p className="text-text-muted text-[15px]">{t('changeLater')}</p>
						<Button asChild className={cn(SETUP_BUTTON, 'mt-4')}>
							<Link href="/today">
								{t('goToToday')}
								<ArrowRightIcon size={18} />
							</Link>
						</Button>
					</div>
				) : (
					<>
						<p className="text-text-muted max-w-[52ch] text-[17px] leading-[1.55]">{t('body')}</p>
						<div className="border-border bg-surface mt-8 flex flex-col gap-3.5 rounded-[22px] border p-[18px]">
							<Label htmlFor={`${id}-time`} className="text-[15px] font-semibold">
								{t('timeLabel')}
							</Label>
							<Input
								id={`${id}-time`}
								type="time"
								value={time}
								onChange={(event) => setTime(event.target.value)}
								className="face-display border-border-strong bg-bg h-16 rounded-[14px] text-[34px] font-bold tabular-nums"
							/>
							<p className="text-text-muted text-[14px]">{t('changeLater')}</p>
						</div>

						<p role="alert" className="text-danger mt-4 text-[15px] empty:hidden">
							{hasFailed ? t('saveFailed') : null}
						</p>

						{isValidTime ? (
							<div className="mt-6 flex flex-col gap-2.5">
								<Button asChild className={SETUP_BUTTON}>
									<a href={`/api/reminder?time=${encodeURIComponent(time)}`} onClick={save}>
										<CalendarIcon size={20} />
										{t('addFile')}
									</a>
								</Button>
								<Button
									asChild
									variant="outline"
									className={cn(SETUP_BUTTON, 'border-border-strong bg-surface')}
								>
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
							</div>
						) : (
							<p className="text-text-muted mt-6 text-[15px]">{t('pickTime')}</p>
						)}
					</>
				)}
			</SetupMain>
			<SetupAside label={t('asideLabel')} lead={t('asideLead')}>
				<AsideCard className="flex items-center gap-4">
					<span
						aria-hidden
						className="border-border flex h-[60px] w-14 flex-none flex-col overflow-hidden rounded-xl border"
					>
						<span className="bg-coral text-coral-ink grid h-[18px] place-items-center text-[10px] font-bold tracking-[0.08em]">
							<CalendarIcon size={12} />
						</span>
						<span className="face-display grid flex-1 place-items-center text-[15px] font-extrabold tabular-nums">
							{isValidTime ? time : '--:--'}
						</span>
					</span>
					<span className="flex min-w-0 flex-col gap-1">
						<span className="text-[16px] font-semibold">{details.title}</span>
						<span className="text-text-muted text-[14px] tabular-nums">
							{isValidTime ? t('every', { time }) : t('pickTime')}
						</span>
						<span className="text-text-faint text-[13px]">{t('opens')}</span>
					</span>
				</AsideCard>
			</SetupAside>
		</>
	)
}
