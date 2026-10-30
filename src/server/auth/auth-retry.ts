import { withRetry, type RetryOptions } from '@/lib/retry'

// Supabase Auth calls report failures in their result instead of throwing.
// A network failure or a 5xx is worth another try; any other answer (wrong
// password, taken email) is final and goes back to the caller as it came.

interface AuthResult {
	readonly error: { readonly code?: string } | null
}

type RetryOverrides = Partial<Omit<RetryOptions, 'isRetryable'>>

const TAKEN_CODES = new Set(['user_already_exists', 'email_exists'])

export async function retryAuthCall<Result extends AuthResult>(
	call: () => Promise<Result>,
	{ isRetryable, retry }: { isRetryable: (error: unknown) => boolean; retry?: RetryOverrides }
): Promise<Result> {
	return withRetry(
		async () => {
			const result = await call()
			if (result.error != null && isRetryable(result.error)) throw result.error
			return result
		},
		{ ...retry, isRetryable }
	)
}

/**
 * Signs up, retrying network failures. A try whose answer was lost may still
 * have made the account, so the retry hears "taken". Signing in with the same
 * password then proves the account is this person's, and they carry on.
 */
export async function signUpOnce<SignUp extends AuthResult, SignIn extends AuthResult>({
	signUp,
	signIn,
	isRetryable,
	retry
}: {
	signUp: () => Promise<SignUp>
	signIn: () => Promise<SignIn>
	isRetryable: (error: unknown) => boolean
	retry?: RetryOverrides
}): Promise<SignUp | SignIn> {
	let attempts = 0
	const result = await retryAuthCall(
		() => {
			attempts += 1
			return signUp()
		},
		{ isRetryable, retry }
	)
	if (attempts === 1 || !TAKEN_CODES.has(result.error?.code ?? '')) return result

	const signedIn = await retryAuthCall(signIn, { isRetryable, retry })
	return signedIn.error == null ? signedIn : result
}
