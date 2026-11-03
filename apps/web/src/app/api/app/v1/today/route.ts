import { endpoints } from '@kept/contract'
import { createAppRoute } from '@/server/api/app-route'
import { getToday } from '@/server/app-api/today'

export const GET = createAppRoute(endpoints.getToday, getToday)
