import Image, { type StaticImageData } from 'next/image'
import { Link } from '@/i18n/routing'
import { SiteNav, linkClass } from '@/components/landing/site-nav'

// The frame both sign-in pages share: the form on the left; on the right one
// of the home page's ledger pictures, full bleed, with the piece of Kept the
// person is about to use set on it.
export function AuthShell({
	heading,
	support,
	form,
	note,
	switchText,
	switchLink,
	switchHref,
	fragment,
	picture
}: {
	heading: string
	support: string
	form: React.ReactNode
	note: React.ReactNode
	switchText: string
	switchLink: string
	switchHref: '/sign-in' | '/sign-up'
	fragment: React.ReactNode
	picture: { src: StaticImageData; alt: string; position: string }
}) {
	return (
		<div className="grid min-h-svh lg:grid-cols-2">
			<div className="flex flex-col">
				<SiteNav />
				<main className="flex flex-1 flex-col justify-center px-(--page-margin) pt-8 pb-20 lg:py-16">
					<div className="w-full lg:max-w-[30rem]">
						<h1 data-reveal className="text-head mb-6 font-medium tracking-[-0.05em]">
							{heading}
						</h1>
						<p data-reveal className="text-body mb-10 max-w-[40ch] delay-[70ms]">
							{support}
						</p>
						{form}
						<div data-reveal className="delay-[350ms]">
							<div className="text-small text-text-muted mt-8 flex flex-col gap-3">{note}</div>
							<p className="text-body mt-10">
								{switchText}{' '}
								<Link
									href={switchHref}
									className={`${linkClass} decoration-current underline-offset-[0.25em]`}
								>
									{switchLink}
								</Link>
							</p>
						</div>
					</div>
				</main>
			</div>
			<aside className="bg-field-3 relative flex min-h-[32rem] items-end justify-end overflow-hidden px-(--page-margin) py-(--page-margin) lg:min-h-0">
				<Image
					src={picture.src}
					alt={picture.alt}
					fill
					priority
					sizes="(min-width: 1024px) 50vw, 100vw"
					className={`object-cover ${picture.position} motion-safe:animate-[drift_24s_var(--ease-soft)_infinite_alternate]`}
				/>
				<div
					aria-hidden
					data-reveal
					className="relative aspect-[4/3] w-full max-w-[30rem] delay-[280ms]"
				>
					{fragment}
				</div>
			</aside>
		</div>
	)
}
