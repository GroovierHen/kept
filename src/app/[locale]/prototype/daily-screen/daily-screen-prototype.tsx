'use client'

// PROTOTYPE ONLY. Three variants of the daily screen, switchable via
// `?variant=A|B|C`, plus `?state=` to jump between the three screen states
// from the Kept day decision (report due on time / late / after a gap, and
// done for today). Answers the wayfinder ticket "What does the daily screen
// look like, and which 4 shared pieces does it use?".
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/routing'
import { cn } from '@/lib/cn'
import { PrototypeSwitcher } from '@/components/prototype-switcher'
import { SCENARIOS, useCheckIn, type Scenario } from './check-in'
import { VariantA, variantAName } from './variant-a'
import { VariantB, variantBName } from './variant-b'
import { VariantC, variantCName } from './variant-c'

const VARIANTS = [
	{ key: 'A', name: variantAName, Component: VariantA },
	{ key: 'B', name: variantBName, Component: VariantB },
	{ key: 'C', name: variantCName, Component: VariantC }
]

export function DailyScreenPrototype() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()
	const variantKey = searchParams.get('variant') ?? 'A'
	const scenario = (SCENARIOS.find((s) => s.key === searchParams.get('state'))?.key ??
		'onTime') satisfies Scenario
	const variant = VARIANTS.find((v) => v.key === variantKey) ?? VARIANTS[0]!

	function setScenario(next: Scenario) {
		const params = new URLSearchParams(searchParams.toString())
		params.set('state', next)
		router.replace(`${pathname}?${params.toString()}`)
	}

	return (
		<div className="bg-bg min-h-screen">
			<div className="flex flex-wrap justify-center gap-1 bg-black px-2 py-1.5 text-xs text-white">
				<span className="px-1 py-1 text-fuchsia-300">PROTOTYPE · state:</span>
				{SCENARIOS.map((s) => (
					<button
						key={s.key}
						type="button"
						onClick={() => setScenario(s.key)}
						className={cn(
							'rounded-full px-2 py-1',
							s.key === scenario ? 'bg-fuchsia-500' : 'hover:bg-white/20'
						)}
					>
						{s.label}
					</button>
				))}
			</div>
			<VariantHost
				key={`${variant.key}-${scenario}`}
				scenario={scenario}
				Component={variant.Component}
			/>
			<PrototypeSwitcher variants={VARIANTS.map(({ key, name }) => ({ key, name }))} />
		</div>
	)
}

function VariantHost({
	scenario,
	Component
}: {
	scenario: Scenario
	Component: (typeof VARIANTS)[number]['Component']
}) {
	const checkIn = useCheckIn(scenario)
	return <Component checkIn={checkIn} />
}
