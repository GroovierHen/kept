import { endpoints } from '@kept/contract'
import { createAppRoute } from '@/server/api/app-route'
import { getMe, provisionMe } from '@/server/app-api/me'

export const GET = createAppRoute(endpoints.getMe, getMe)
export const POST = createAppRoute(endpoints.provisionMe, provisionMe)
