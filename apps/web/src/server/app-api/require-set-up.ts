import 'server-only'
import { AppError } from '@/lib/errors/app-error'
import { readSetupStep } from '@/server/setup/progress'

/**
 * The Today screen and its writes are for a finished setup. The web sends an
 * unfinished one to /setup; the app asks getMe first and does the same, so
 * reaching this is the app's mistake, not a crash.
 */
export async function requireSetUp(userId: string): Promise<void> {
	if ((await readSetupStep(userId)) != null) {
		throw new AppError('Finish setting up first.', { status: 404, code: 'setup_unfinished' })
	}
}
