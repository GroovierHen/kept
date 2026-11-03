// Expo's default Metro config, which handles the pnpm workspace by itself
// (SDK 52+), with Sentry's source-map plumbing added on top.
const { getSentryExpoConfig } = require('@sentry/react-native/metro')

module.exports = getSentryExpoConfig(__dirname)
