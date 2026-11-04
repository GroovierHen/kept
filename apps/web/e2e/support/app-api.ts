import { expect, type APIRequestContext } from '@playwright/test'
import { endpoints, todayResponse, type EndpointName, type ResponseOf } from '@kept/contract'
import { FAKE_SERVICES_URL } from './test-env'

// Talking to /api/app/v1 the way the phone does: a Supabase access token as a
// bearer header, each route by its contract name.

/** Signs up (or in: the fake keeps one person per email) against the fake Supabase Auth. */
export async function accessToken(request: APIRequestContext, email: string): Promise<string> {
	const response = await request.post(`${FAKE_SERVICES_URL}/auth/v1/signup`, {
		data: { email, password: 'a-test-password' }
	})
	const { access_token } = (await response.json()) as { access_token: string }
	return access_token
}

export function appClient(request: APIRequestContext, token: string) {
	async function call(name: EndpointName, body?: unknown) {
		const { method, path } = endpoints[name]
		return request.fetch(path, {
			method,
			headers: { authorization: `Bearer ${token}` },
			...(body !== undefined && { data: body })
		})
	}
	/** A call that must succeed, answering its parsed response. */
	async function ok<N extends EndpointName>(name: N, body?: unknown): Promise<ResponseOf<N>> {
		const response = await call(name, body)
		expect(response.status(), await response.text()).toBe(200)
		// Indexing the map by a generic name loses which schema it is; the parse is still that route's.
		return endpoints[name].response.parse(await response.json()) as ResponseOf<N>
	}
	return {
		call,
		ok,
		async today() {
			const response = await call('getToday')
			expect(response.status()).toBe(200)
			return todayResponse.parse(await response.json())
		}
	}
}
