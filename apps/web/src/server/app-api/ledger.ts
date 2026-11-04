import 'server-only'
import type { endpoints } from '@kept/contract'
import type { AppRouteHandler } from '@/server/api/app-handler'
import { readLedgerView } from '@/server/today/read-ledger-view'
import { requireSetUp } from './require-set-up'

export const getLedger: AppRouteHandler<typeof endpoints.getLedger> = async ({ user }) => {
	await requireSetUp(user.id)
	return readLedgerView(user.id)
}
