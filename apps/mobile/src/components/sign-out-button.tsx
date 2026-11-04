import { copy } from '@/copy'
import { signOut } from '@/lib/supabase'
import { Button } from './ui/button'

/** Signs out of this device only; the web stays signed in. */
export function SignOutButton() {
	return <Button variant="quiet" label={copy.today.signOut} onPress={() => void signOut()} />
}
