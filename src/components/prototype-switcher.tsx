'use client'

// PROTOTYPE ONLY: the floating variant switcher for throwaway UI prototypes.
// Lives on a prototype/* branch, never on main.
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/routing'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons'

type Variant = { key: string; name: string }

export function PrototypeSwitcher({ variants }: { variants: Variant[] }) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const currentKey = searchParams.get('variant') ?? variants[0]!.key
	const index = Math.max(
		0,
		variants.findIndex((v) => v.key === currentKey)
	)
	const current = variants[index]!

	function go(step: number) {
		const next = variants[(index + step + variants.length) % variants.length]!
		const params = new URLSearchParams(searchParams.toString())
		params.set('variant', next.key)
		router.replace(`${pathname}?${params.toString()}`)
	}

	useEffect(() => {
		function onKey(event: KeyboardEvent) {
			const target = event.target
			if (
				target instanceof HTMLElement &&
				(target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
			) {
				return
			}
			if (event.key === 'ArrowLeft') go(-1)
			if (event.key === 'ArrowRight') go(1)
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	})

	if (process.env.NODE_ENV === 'production') return null

	return (
		<div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black px-2 py-1.5 text-sm text-white shadow-2xl ring-2 ring-fuchsia-500">
			<button
				type="button"
				aria-label="Previous variant"
				className="rounded-full p-1.5 hover:bg-white/20"
				onClick={() => go(-1)}
			>
				<ChevronLeftIcon />
			</button>
			<span className="px-2 font-mono whitespace-nowrap">
				{current.key} ({current.name})
			</span>
			<button
				type="button"
				aria-label="Next variant"
				className="rounded-full p-1.5 hover:bg-white/20"
				onClick={() => go(1)}
			>
				<ChevronRightIcon />
			</button>
		</div>
	)
}
