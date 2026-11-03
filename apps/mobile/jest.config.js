const expoPreset = require('jest-expo/jest-preset')

// jest-expo's allow-list, plus the ESM-only packages this app pulls in that it
// doesn't name: Sentry's core (under @sentry/react-native) and PostHog's.
const [allowList, ...restIgnorePatterns] = expoPreset.transformIgnorePatterns
const EXTRA_ESM = ['@sentry/.*', 'posthog-react-native', '@posthog/.*']

/** @type {import('jest').Config} */
module.exports = {
	preset: 'jest-expo',
	transformIgnorePatterns: [
		allowList.replace('(?!(', `(?!(${EXTRA_ESM.join('|')}|`),
		...restIgnorePatterns
	],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1'
	},
	testMatch: ['<rootDir>/src/**/*.test.[jt]s?(x)']
}
