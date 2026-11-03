// Building the first plan is claimed on the goal before the AI is called, so
// a refresh or a second tab waits for it instead of paying for a second one.
// The request doing the build is stopped at the setup page's time limit, so a
// claim older than that died with it and is free to take again.

/** The setup page's maxDuration. A Next.js segment config must be a literal, so the page repeats it. */
export const PLAN_BUILD_LIMIT_SECONDS = 200

const MS_PER_SECOND = 1000

/** The earliest claim that can still belong to a running build. */
export function oldestLiveClaim(now: Date): Date {
	return new Date(now.getTime() - PLAN_BUILD_LIMIT_SECONDS * MS_PER_SECOND)
}

export function isBuildRunning({ startedAt, now }: { startedAt: Date; now: Date }): boolean {
	return startedAt > oldestLiveClaim(now)
}

/** How long a build has run, so a refreshed page's wait picks up where it was. */
export function secondsSince({ startedAt, now }: { startedAt: Date; now: Date }): number {
	return Math.floor((now.getTime() - startedAt.getTime()) / MS_PER_SECOND)
}
