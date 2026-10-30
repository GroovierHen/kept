import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// tailwind-merge has to know the type steps in globals.css (`text-body`,
// `text-head`, ...) are font sizes. Otherwise it reads them as text colours
// and drops `text-accent-ink` from cn('text-accent-ink', 'text-body'),
// leaving a button's label the colour of its fill.
const twMerge = extendTailwindMerge({
	extend: { theme: { text: ['small', 'body', 'lead', 'head', 'display'] } }
})

// Merge conditional classNames AND resolve conflicting Tailwind utilities
// (cn('p-2', condition && 'p-4') keeps only p-4, not both) — plain clsx
// alone would leave both classes in the string and let CSS source order
// decide, which silently breaks whichever one loses.
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}
