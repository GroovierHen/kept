import 'server-only'
import type { Endpoint } from '@kept/contract'
import { captureError } from '@/lib/observability/capture-error'
import { getBearerUser } from '@/server/auth/bearer-user'
import { buildAppRoute, type AppRouteHandler } from './app-handler'

// Every /api/app/v1 route is built here, from its @kept/contract endpoint:
//
//   export const GET = createAppRoute(endpoints.getToday, getToday)
//
// The route file holds nothing else; the handler lives in src/server/app-api/.
// See src/server/api/app-handler.ts for the steps each request runs.
export function createAppRoute<E extends Endpoint>(endpoint: E, handler: AppRouteHandler<E>) {
	return buildAppRoute(endpoint, handler, {
		resolveUser: getBearerUser,
		reportUnexpected: (error) => {
			captureError(error, { route: endpoint.path })
		}
	})
}
