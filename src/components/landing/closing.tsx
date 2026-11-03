import { getTranslations } from 'next-intl/server'
import { startSignUp } from '@/server/actions/auth'
import { lift } from '@/components/brand/lift'

// The close: a green panel with a lime ring turning in its corner, the
// invitation, and the email field with its button. The email waits for the
// sign-up form, which asks for a password next.
export async function Closing() {
	const t = await getTranslations('HomePage.cta')

	return (
		<section
			aria-labelledby="start-heading"
			className="mx-auto max-w-[1200px] px-(--page-margin) pb-24"
		>
			<div
				data-reveal
				className="bg-accent text-accent-ink relative overflow-hidden rounded-[36px] p-[clamp(40px,7vw,88px)]"
			>
				<div aria-hidden className="dot-grid absolute inset-0" />
				<div
					aria-hidden
					className="border-coral absolute -right-[120px] -bottom-40 size-[440px] rounded-full border-[60px] opacity-90"
				/>
				<div className="relative max-w-[640px]">
					<h2
						id="start-heading"
						className="face-display text-[clamp(44px,6vw,76px)] leading-[0.98] font-extrabold"
					>
						{t('heading')}
					</h2>
					<p className="mt-5 text-[18px] leading-[1.55] opacity-85">{t('note')}</p>
					<form
						action={startSignUp}
						className="bg-surface mt-8 flex max-w-[540px] flex-wrap gap-2.5 rounded-[18px] p-2"
					>
						<label htmlFor="start-email" className="sr-only">
							{t('emailLabel')}
						</label>
						<input
							id="start-email"
							name="email"
							type="email"
							required
							autoComplete="email"
							placeholder={t('placeholder')}
							className="text-text placeholder:text-text-faint focus-visible:outline-accent min-w-0 flex-[1_1_220px] rounded-xl bg-transparent px-4 py-3.5 text-[17px] outline-none focus-visible:outline-2"
						/>
						<button
							type="submit"
							className={`bg-night text-night-ink focus-visible:outline-accent flex-auto rounded-xl px-[22px] py-3.5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 sm:flex-none ${lift}`}
						>
							{t('button')}
						</button>
					</form>
				</div>
			</div>
		</section>
	)
}
