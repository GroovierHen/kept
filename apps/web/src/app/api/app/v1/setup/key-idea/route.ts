import { endpoints } from '@kept/contract'
import { createAppRoute } from '@/server/api/app-route'
import { learnFirstKeyIdea } from '@/server/app-api/setup'

export const POST = createAppRoute(endpoints.learnFirstKeyIdea, learnFirstKeyIdea)
