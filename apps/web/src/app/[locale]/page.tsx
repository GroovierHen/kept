import { pageMetadata } from '@/lib/seo/metadata'
import { BrandTheme } from '@/components/brand/brand-theme'
import { LandingNav } from '@/components/landing/landing-nav'
import { Hero } from '@/components/landing/hero'
import { Marquee } from '@/components/landing/marquee'
import { HowItWorks } from '@/components/landing/how-it-works'
import { PainSwitches } from '@/components/landing/pain-switches'
import { PlanShowcase } from '@/components/landing/plan-showcase'
import { Ledger } from '@/components/landing/ledger'
import { Faq } from '@/components/landing/faq'
import { Closing } from '@/components/landing/closing'
import { LandingFooter } from '@/components/landing/landing-footer'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
	return pageMetadata({ path: '/', locale: (await params).locale })
}

// The page is an argument in order: what Kept is and what a check-in looks
// like, the four steps of a day, the reasons plans fail and what Kept does
// about each, what a goal becomes, how progress is counted, the honest
// answers, then the sign-up.
export default function HomePage() {
	return (
		<BrandTheme>
			<LandingNav />
			<main>
				<Hero />
				<Marquee />
				<HowItWorks />
				<PainSwitches />
				<PlanShowcase />
				<Ledger />
				<Faq />
				<Closing />
			</main>
			<LandingFooter />
		</BrandTheme>
	)
}
