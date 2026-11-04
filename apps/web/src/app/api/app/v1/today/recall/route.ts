import { endpoints } from '@kept/contract'
import { createAppRoute } from '@/server/api/app-route'
import { answerRecall } from '@/server/app-api/check-in'

export const POST = createAppRoute(endpoints.answerRecall, answerRecall)

// Marking is an AI call with up to 2 tries of 45s, the same as the Today page.
export const maxDuration = 100
