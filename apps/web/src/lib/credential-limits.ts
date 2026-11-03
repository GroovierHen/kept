// Shared by the sign-up form and the server's check, so the form stops what the
// server would refuse. Plain numbers, so the form doesn't pull Zod into the browser.

export const MIN_PASSWORD_LENGTH = 8
// Supabase Auth refuses longer passwords, so they are caught with a clear message.
export const MAX_PASSWORD_LENGTH = 72
// The longest address the email standard allows.
export const MAX_EMAIL_LENGTH = 254
