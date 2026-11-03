import { cn } from '@/lib/cn'

// A tally of five, the way a ledger counts: four strokes and one across. The
// strokes draw in and start over while something loads (globals.css). With
// reduced motion it stays a finished tally.
const STROKES = ['M16 8 13 88', 'M38 10 36 86', 'M61 8 58 88', 'M83 10 81 86', 'M3 72 94 22']

export function TallyMark({ className, ...props }: React.ComponentProps<'svg'>) {
	return (
		<svg
			viewBox="0 0 97 96"
			fill="none"
			stroke="currentColor"
			strokeWidth={7}
			aria-hidden
			className={cn('tally-mark', className)}
			{...props}
		>
			{STROKES.map((stroke) => (
				<path key={stroke} d={stroke} pathLength={1} />
			))}
		</svg>
	)
}
