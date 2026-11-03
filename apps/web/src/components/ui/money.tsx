import { cn } from '@/lib/cn'
import { formatPence } from '@/lib/money'

type MoneyProps = Omit<React.ComponentProps<'span'>, 'children'> & {
	pence: number
	per?: 'day' | 'week' | 'month' | 'year'
	/** Whole pounds, for figures shown as "about": £11 rather than £11.01. */
	isRounded?: boolean
}

// Sets no colour on purpose, here or on the "a month" part: both inherit from
// whatever they sit on, so they stay readable on a selected choice's gold fill,
// where the muted text colour would nearly disappear.
export function Money({ pence, per, isRounded, className, ...props }: MoneyProps) {
	return (
		<span className={cn('font-semibold whitespace-nowrap tabular-nums', className)} {...props}>
			{formatPence({ pence, isRounded })}
			{per != null && <span className="text-small font-normal"> a {per}</span>}
		</span>
	)
}
