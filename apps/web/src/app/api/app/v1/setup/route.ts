import { endpoints } from '@kept/contract'
import { createAppRoute } from '@/server/api/app-route'
import { getSetup } from '@/server/app-api/setup'

export const GET = createAppRoute(endpoints.getSetup, getSetup)
