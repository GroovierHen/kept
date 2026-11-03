import { execFileSync } from 'node:child_process'
import { startFakeServices } from './support/fake-services'
import { DATABASE_ENV, FAKE_SERVICES_PORT, RUNS_AGAINST_LIVE_URL } from './support/test-env'

export default async function globalSetup() {
	if (RUNS_AGAINST_LIVE_URL) return
	execFileSync('pnpm', ['prisma', 'migrate', 'deploy'], {
		stdio: 'inherit',
		env: { ...process.env, ...DATABASE_ENV }
	})
	return startFakeServices(FAKE_SERVICES_PORT)
}
