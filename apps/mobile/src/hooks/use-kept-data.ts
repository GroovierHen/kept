import { useQuery } from '@tanstack/react-query'
import { readMe } from '@/lib/account'
import { api } from '@/lib/api'

// The signed-in person's data, through the API (lib/api.ts). One query key
// per endpoint, so a refetch anywhere refreshes every screen that shows it.

export function useMe() {
	return useQuery({ queryKey: ['me'], queryFn: ({ signal }) => readMe(signal) })
}

export function useToday({ enabled }: { enabled: boolean }) {
	return useQuery({
		queryKey: ['today'],
		queryFn: ({ signal }) => api('getToday', { signal }),
		enabled
	})
}
