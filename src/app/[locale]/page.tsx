import { pageMetadata } from '@/lib/seo/metadata'
import { Hero } from '@/components/landing/hero'
import { HowItWorks } from '@/components/landing/how-it-works'
import { PlanShowcase } from '@/components/landing/plan-showcase'
import { SoundFamiliar } from '@/components/landing/sound-familiar'
import { About } from '@/components/landing/about'
import { Faq } from '@/components/landing/faq'
import { Closing } from '@/components/landing/closing'
import { LandingFooter } from '@/components/landing/landing-footer'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
	return pageMetadata({ path: '/', locale: (await params).locale })
}

// The page is written for someone who has never heard of Kept, and argues in
// order: what it is and what a check-in looks like, how little time it takes,
// what it makes from a goal, the ways goals usually fail and what Kept does
// about each, why it's called Kept, the honest answers, then the sign-up.
export default function HomePage() {
	return (
		<>
			<main>
				<Hero />
				<HowItWorks />
				<PlanShowcase />
				<SoundFamiliar />
				<About />
				<Faq />
				<Closing />
			</main>
			<LandingFooter />
		</>
	)
}
