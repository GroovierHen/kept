import { existsSync } from 'node:fs'
import { defineConfig } from 'prisma/config'

// Prisma 7 no longer loads env files itself. Prisma 6 read `.env` and never
// `.env.local`, which here points at the production database — keep exactly
// that, so a local `migrate dev` or `migrate reset` can't reach production by
// accident. CI and the deploy workflow set the variables directly.
if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
	schema: 'prisma/schema',
	migrations: { path: 'prisma/schema/migrations' },
	// The CLI's connection: migrate, diff and db execute. Migrations need the
	// session pooler (DIRECT_URL, port 5432), never the transaction pooler the
	// app uses — see deploy-migrations.yml. Left unset, `prisma generate` still
	// works; only the commands that talk to a database fail.
	datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL }
})
