import { endpoints } from '@kept/contract'
import { createAppRoute } from '@/server/api/app-route'
import { getMe } from '@/server/app-api/me'

export const GET = createAppRoute(endpoints.getMe, getMe)
