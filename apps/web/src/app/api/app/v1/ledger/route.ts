import { endpoints } from '@kept/contract'
import { createAppRoute } from '@/server/api/app-route'
import { getLedger } from '@/server/app-api/ledger'

export const GET = createAppRoute(endpoints.getLedger, getLedger)
