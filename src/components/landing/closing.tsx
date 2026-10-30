import { getTranslations } from 'next-intl/server'
import { startSignUp } from '@/server/actions/auth'

// The closing sentence has a blank in it, and the blank is the form: "Sign me
// up as ___ and start." Its last word is the submit button. The email waits
// for the sign-up form, which asks for a password next.
export async function Closing() {
	const t = await getTranslations('HomePage.cta')

	return (
		<section
			aria-labelledby="start-heading"
			className="bg-field-3 text-field-3-ink px-(--page-margin) py-28 md:py-44"
		>
			<form action={startSignUp} data-reveal>
				<label htmlFor="start-email" className="sr-only">
					{t('emailLabel')}
				</label>
				<h2
					id="start-heading"
					className="text-head flex flex-wrap items-baseline gap-x-[0.25em] gap-y-[0.15em] leading-[1.15] font-medium tracking-[-0.05em] md:max-w-[16em]"
				>
					<span>{t('before')}</span>{' '}
					<input
						id="start-email"
						name="email"
						type="email"
						required
						autoComplete="email"
						placeholder={t('placeholder')}
						className="bg-field-4 placeholder:text-text-faint h-[1.15em] w-full min-w-0 rounded px-[0.25em] tracking-[-0.04em] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 md:w-[8.5em]"
					/>{' '}
					<span>{t('after')}</span>{' '}
					<button
						type="submit"
						className="bg-accent text-accent-ink hover:bg-accent-hover h-[1.15em] rounded px-[0.25em] tracking-[-0.05em] transition-[background-color,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 active:scale-[0.97]"
					>
						{t('button')}
					</button>
				</h2>
				<p className="text-body mt-6 max-w-[48ch]">{t('note')}</p>
			</form>
		</section>
	)
}
