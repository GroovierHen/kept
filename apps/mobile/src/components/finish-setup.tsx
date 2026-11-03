import { useEffect } from 'react'
import { Linking, StyleSheet, View } from 'react-native'
import { copy } from '@/copy'
import { track } from '@/lib/analytics'
import { env } from '@/lib/env'
import { signOut } from '@/lib/supabase'
import { space } from '@/lib/theme'
import { Button } from './ui/button'
import { Screen } from './ui/screen'
import { Text } from './ui/text'

/** Setup runs on the web for now; this sends the person there and back. */
export function FinishSetup({ onRefresh }: { onRefresh: () => void }) {
	useEffect(() => track('page_viewed', { page: 'finish_setup' }), [])
	return (
		<Screen>
			<View style={styles.header}>
				<Text variant="title">{copy.finishSetup.heading}</Text>
				<Text tone="muted">{copy.finishSetup.support}</Text>
			</View>
			{env.EXPO_PUBLIC_SITE_URL != null && (
				<Button
					label={copy.finishSetup.open}
					onPress={() => void Linking.openURL(`${env.EXPO_PUBLIC_SITE_URL}/setup`)}
				/>
			)}
			<Button variant="secondary" label={copy.finishSetup.refresh} onPress={onRefresh} />
			<Button variant="quiet" label={copy.today.signOut} onPress={() => void signOut()} />
		</Screen>
	)
}

const styles = StyleSheet.create({ header: { gap: space.md, paddingTop: space.xl } })
