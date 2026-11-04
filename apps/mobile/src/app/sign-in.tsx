import { useEffect, useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Button } from '@/components/ui/button'
import { Screen } from '@/components/ui/screen'
import { Text } from '@/components/ui/text'
import { copy } from '@/copy'
import { track } from '@/lib/analytics'
import { signInWithPassword, type SignInResult } from '@/lib/supabase'
import { colors, fontFamily, radii, space, type } from '@/lib/theme'

type Failure = Extract<SignInResult, { ok: false }>['reason'] | 'missing'

export default function SignInScreen() {
	const router = useRouter()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [failure, setFailure] = useState<Failure | null>(null)
	const [isPending, setIsPending] = useState(false)

	useEffect(() => track('page_viewed', { page: 'sign_in' }), [])

	async function submit() {
		if (email.trim() === '' || password === '') {
			setFailure('missing')
			return
		}
		setIsPending(true)
		setFailure(null)
		const result = await signInWithPassword(email.trim(), password)
		// On success the session listener moves to Today; this screen unmounts.
		if (!result.ok) {
			setFailure(result.reason)
			setIsPending(false)
		}
	}

	return (
		<Screen>
			<View style={styles.header}>
				<Text variant="eyebrow" tone="muted">
					Kept
				</Text>
				<Text variant="head">{copy.signIn.heading}</Text>
				<Text tone="muted">{copy.signIn.support}</Text>
			</View>
			<View style={styles.form}>
				<Text variant="small" tone="muted">
					{copy.signIn.email}
				</Text>
				<TextInput
					style={styles.input}
					value={email}
					onChangeText={setEmail}
					autoCapitalize="none"
					autoComplete="email"
					keyboardType="email-address"
					textContentType="emailAddress"
					accessibilityLabel={copy.signIn.email}
					returnKeyType="next"
				/>
				<Text variant="small" tone="muted">
					{copy.signIn.password}
				</Text>
				<TextInput
					style={styles.input}
					value={password}
					onChangeText={setPassword}
					secureTextEntry
					autoComplete="current-password"
					textContentType="password"
					accessibilityLabel={copy.signIn.password}
					returnKeyType="go"
					onSubmitEditing={() => void submit()}
				/>
				{failure != null && (
					<Text tone="danger" accessibilityRole="alert">
						{copy.signIn.errors[failure]}
					</Text>
				)}
				<Button
					label={isPending ? copy.signIn.pending : copy.signIn.submit}
					isPending={isPending}
					onPress={() => void submit()}
				/>
			</View>
			<View style={styles.switch}>
				<Text tone="muted">{copy.signIn.switch}</Text>
				<Button
					variant="quiet"
					label={copy.signIn.switchLink}
					onPress={() => router.push('/sign-up')}
				/>
			</View>
		</Screen>
	)
}

const styles = StyleSheet.create({
	header: { gap: space.md, paddingTop: space.xl, paddingBottom: space.lg },
	form: { gap: space.sm },
	input: {
		...type.body,
		fontFamily: fontFamily.text,
		color: colors.text,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.borderStrong,
		borderRadius: radii.sm,
		paddingHorizontal: space.md,
		minHeight: 52,
		marginBottom: space.sm
	},
	switch: { paddingTop: space.lg, alignItems: 'flex-start' }
})
