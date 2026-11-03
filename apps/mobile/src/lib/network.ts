import type { NetInfoState } from '@react-native-community/netinfo'

/**
 * Offline means the phone has no connection, or one that reaches nothing.
 * `isInternetReachable` is null until NetInfo has checked; unknown is online,
 * so a fresh launch never flashes "you're offline".
 */
export function isOffline(
	state: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>
): boolean {
	return state.isConnected === false || state.isInternetReachable === false
}
