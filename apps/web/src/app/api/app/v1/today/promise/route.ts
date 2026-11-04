import { endpoints } from '@kept/contract'
import { createAppRoute } from '@/server/api/app-route'
import { commitPromise } from '@/server/app-api/check-in'

export const POST = createAppRoute(endpoints.commitPromise, commitPromise)
