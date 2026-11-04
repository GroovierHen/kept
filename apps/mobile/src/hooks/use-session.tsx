import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { forgetAccount } from '@/lib/account'
import { queryClient } from '@/lib/query-client'
import { hasSession, onSessionChange } from '@/lib/supabase'
import { resetIdentity } from '@/lib/analytics'
import { cancelDailyReminder } from '@/lib/reminders'

type SessionState = 'loading' | 'signedIn' | 'signedOut'

const SessionContext = createContext<SessionState>('loading')

/** Whether this device holds a Supabase session, kept current as it signs in and out. */
export function SessionProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<SessionState>('loading')

	useEffect(() => {
		let isCurrent = true
		void hasSession().then((signedIn) => {
			if (isCurrent) setState(signedIn ? 'signedIn' : 'signedOut')
		})
		const unsubscribe = onSessionChange((signedIn) => {
			setState(signedIn ? 'signedIn' : 'signedOut')
			if (!signedIn) {
				// Nothing of the last person stays on the device.
				queryClient.clear()
				forgetAccount()
				resetIdentity()
				void cancelDailyReminder()
			}
		})
		return () => {
			isCurrent = false
			unsubscribe()
		}
	}, [])

	return <SessionContext value={state}>{children}</SessionContext>
}

export function useSession(): SessionState {
	return useContext(SessionContext)
}
