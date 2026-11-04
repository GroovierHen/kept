import { endpoints } from '@kept/contract'
import { createAppRoute } from '@/server/api/app-route'
import { finishLesson } from '@/server/app-api/check-in'

export const POST = createAppRoute(endpoints.finishLesson, finishLesson)
