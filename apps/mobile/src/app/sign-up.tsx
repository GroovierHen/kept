import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Button } from '@/components/ui/button'
import { Screen } from '@/components/ui/screen'
import { Text } from '@/components/ui/text'
import { TextField } from '@/components/ui/text-field'
import { copy } from '@/copy'
import { track } from '@/lib/analytics'
import { credentialProblem, type SignUpFailure } from '@/lib/credentials'
import { signUpWithPassword } from '@/lib/supabase'
import { space } from '@/lib/theme'

// A new account on the phone. Once Supabase opens the session, the session
// listener moves to setup, whose first read saves the account (lib/account.ts).
export default function SignUpScreen() {
	const router = useRouter()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [failure, setFailure] = useState<SignUpFailure | null>(null)
	const [isPending, setIsPending] = useState(false)

	useEffect(() => track('page_viewed', { page: 'sign_up' }), [])

	async function submit() {
		const trimmed = email.trim().toLowerCase()
		const problem = credentialProblem(trimmed, password)
		setFailure(problem)
		if (problem != null) return
		setIsPending(true)
		const result = await signUpWithPassword(trimmed, password)
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
				<Text variant="head" accessibilityRole="header">
					{copy.signUp.heading}
				</Text>
				<Text tone="muted">{copy.signUp.support}</Text>
			</View>
			<View style={styles.form}>
				<TextField
					label={copy.signUp.email}
					placeholder={copy.signUp.emailPlaceholder}
					value={email}
					onChangeText={setEmail}
					autoCapitalize="none"
					autoComplete="email"
					keyboardType="email-address"
					textContentType="emailAddress"
					returnKeyType="next"
				/>
				<TextField
					label={copy.signUp.password}
					value={password}
					onChangeText={setPassword}
					secureTextEntry
					autoComplete="new-password"
					textContentType="newPassword"
					returnKeyType="go"
					onSubmitEditing={() => void submit()}
				/>
				<Text variant="small" tone="muted">
					{copy.signUp.passwordHint}
				</Text>
				{failure != null && (
					<Text tone="danger" accessibilityRole="alert">
						{copy.signUp.errors[failure]}
					</Text>
				)}
				<Button
					label={isPending ? copy.signUp.pending : copy.signUp.submit}
					isPending={isPending}
					onPress={() => void submit()}
				/>
			</View>
			<View style={styles.switch}>
				<Text tone="muted">{copy.signUp.switch}</Text>
				<Button variant="quiet" label={copy.signUp.switchLink} onPress={() => router.back()} />
			</View>
		</Screen>
	)
}

const styles = StyleSheet.create({
	header: { gap: space.md, paddingTop: space.xl, paddingBottom: space.lg },
	form: { gap: space.sm },
	switch: { paddingTop: space.lg, alignItems: 'flex-start' }
})
