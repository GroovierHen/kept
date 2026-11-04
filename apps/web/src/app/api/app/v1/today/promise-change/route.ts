import { endpoints } from '@kept/contract'
import { createAppRoute } from '@/server/api/app-route'
import { changePromise } from '@/server/app-api/check-in'

export const POST = createAppRoute(endpoints.changePromise, changePromise)
