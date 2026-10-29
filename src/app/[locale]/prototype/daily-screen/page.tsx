// PROTOTYPE ONLY: throwaway route, lives on the prototype/daily-screen
// branch, never merged. Three daily screen layouts on one route.
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { DailyScreenPrototype } from './daily-screen-prototype'

export const metadata: Metadata = { robots: { index: false } }

export default function DailyScreenPrototypePage() {
	return (
		<Suspense>
			<DailyScreenPrototype />
		</Suspense>
	)
}
