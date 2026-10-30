import { pageMetadata } from '@/lib/seo/metadata'
import { Hero } from '@/components/landing/hero'
import { HowItWorks } from '@/components/landing/how-it-works'
import { PlanShowcase } from '@/components/landing/plan-showcase'
import { SpendSwitches } from '@/components/landing/spend-switches'
import { About } from '@/components/landing/about'
import { Faq } from '@/components/landing/faq'
import { Closing } from '@/components/landing/closing'
import { LandingFooter } from '@/components/landing/landing-footer'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
	return pageMetadata({ path: '/', locale: (await params).locale })
}

// The page is an argument in order: what Kept is and what a check-in looks
// like, how little time it takes, what your own goal comes to each day, what
// your spends are worth, where the method comes from, the honest answers,
// then the sign-up.
export default function HomePage() {
	return (
		<>
			<main>
				<Hero />
				<HowItWorks />
				<PlanShowcase />
				<SpendSwitches />
				<About />
				<Faq />
				<Closing />
			</main>
			<LandingFooter />
		</>
	)
}
