'use client'

import { useEffect } from 'react'
import { usePathname } from '@/i18n/routing'

// Turns on the entrances in globals.css: marks <html> so [data-reveal] parts
// start hidden, then shows each once as it enters the screen. Nothing is
// hidden until this has run, and anything still hidden on screen a few
// seconds after load is shown anyway. Mounted once in the locale layout; it
// re-scans the page on every route change, since a soft navigation brings in
// new parts without remounting it.
const SAFETY_NET_MS = 2500

export function RevealObserver() {
	const pathname = usePathname()

	useEffect(() => {
		const targets = document.querySelectorAll('[data-reveal]:not(.is-in)')
		document.documentElement.dataset.motion = 'on'

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue
					entry.target.classList.add('is-in')
					observer.unobserve(entry.target)
				}
			},
			{ rootMargin: '0px 0px -12% 0px', threshold: 0.1 }
		)
		targets.forEach((target) => observer.observe(target))

		const safetyNet = window.setTimeout(() => {
			targets.forEach((target) => {
				const rect = target.getBoundingClientRect()
				if (rect.top < window.innerHeight && rect.bottom > 0) target.classList.add('is-in')
			})
		}, SAFETY_NET_MS)

		return () => {
			observer.disconnect()
			window.clearTimeout(safetyNet)
		}
	}, [pathname])

	return null
}
