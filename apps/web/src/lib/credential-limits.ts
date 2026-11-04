// Shared by the sign-up form and the server's check, so the form stops what the
// server would refuse, and with the app's sign-up. Plain numbers, so the form
// doesn't pull Zod into the browser.
export { MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@kept/contract/limits'
