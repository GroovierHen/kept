import type { ReactElement } from 'react'
import { render } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/** Renders with a fresh query client, retries off, so each test starts empty. */
export async function renderWithClient(ui: ReactElement) {
	const client = new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: Infinity },
			mutations: { retry: false, gcTime: Infinity }
		}
	})
	const invalidate = jest.spyOn(client, 'invalidateQueries')
	await render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
	return { client, invalidate }
}
