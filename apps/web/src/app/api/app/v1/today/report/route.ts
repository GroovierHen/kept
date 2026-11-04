import { endpoints } from '@kept/contract'
import { createAppRoute } from '@/server/api/app-route'
import { submitReport } from '@/server/app-api/check-in'

export const POST = createAppRoute(endpoints.submitReport, submitReport)
