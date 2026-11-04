import { endpoints } from '@kept/contract'
import { createAppRoute } from '@/server/api/app-route'
import { rebuildPlan } from '@/server/app-api/setup'

export const POST = createAppRoute(endpoints.rebuildPlan, rebuildPlan)

// Writing a plan is an AI call; the same limit as the setup page (PLAN_BUILD_LIMIT_SECONDS).
export const maxDuration = 200
