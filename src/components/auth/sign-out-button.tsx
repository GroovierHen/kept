import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/cn'
import { signOut } from '@/server/actions/auth'

// Sign out as a plain form, so it works before the page's script has loaded.
// Every screen a signed-in person can reach shows one in its header.
export async function SignOutButton({ className }: { className?: string }) {
	const t = await getTranslations('Auth')

	return (
		<form action={signOut}>
			<button
				type="submit"
				className={cn(
					'text-text-muted hover:text-text min-h-11 rounded-full px-3 text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2',
					className
				)}
			>
				{t('signOut')}
			</button>
		</form>
	)
}
