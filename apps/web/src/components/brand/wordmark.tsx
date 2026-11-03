import { cn } from '@/lib/cn'

// The tick in a green square, then the name. The mark is the logo, drawn
// here rather than taken from the icon set, so its heavy stroke can't change
// when the icon provider does.
export function Wordmark({ size = 'md', className }: { size?: 'sm' | 'md'; className?: string }) {
	return (
		<span className={cn('text-text flex items-center gap-2.5', className)}>
			<span
				className={cn(
					'bg-accent text-accent-ink grid place-items-center',
					size === 'md' ? 'size-8 rounded-[10px]' : 'size-7 rounded-[9px]'
				)}
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden
					className={size === 'md' ? 'size-[18px]' : 'size-[15px]'}
				>
					<path d="M5 12.5l4.5 4.5L19 7.5" />
				</svg>
			</span>
			<span
				className={cn('face-display font-extrabold', size === 'md' ? 'text-[22px]' : 'text-[20px]')}
			>
				Kept
			</span>
		</span>
	)
}
