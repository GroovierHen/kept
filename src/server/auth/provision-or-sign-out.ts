// Supabase opens the session before our User row is saved. If the save fails,
// the session is closed again: a person signed in with no row never sees the
// error (the auth pages send signed-in visitors on), can't finish setup, and
// is never counted as signed up. Signing in again retries the save.
export async function provisionOrSignOut({
	provision,
	signOut
}: {
	provision: () => Promise<void>
	signOut: () => Promise<void>
}): Promise<void> {
	try {
		await provision()
	} catch (error) {
		try {
			await signOut()
		} catch (signOutError) {
			throw new AggregateError(
				[error, signOutError],
				'Saving the user failed, and closing their session failed too'
			)
		}
		throw error
	}
}
