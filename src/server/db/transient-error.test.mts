import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isTransientDbError } from './transient-error.ts'

// Shaped like Prisma's errors: request errors carry `code`, connection
// errors raised before a query carry `errorCode`.
function prismaError(field: 'code' | 'errorCode', value: string) {
	return Object.assign(new Error(value), { [field]: value })
}

test('lost or busy connections are transient', () => {
	for (const code of ['P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2034']) {
		assert.equal(isTransientDbError(prismaError('code', code)), true, code)
	}
	assert.equal(isTransientDbError(prismaError('errorCode', 'P1001')), true)
})

test('errors in the data or the query are not transient', () => {
	for (const code of ['P2002', 'P2003', 'P2025']) {
		assert.equal(isTransientDbError(prismaError('code', code)), false, code)
	}
})

test('anything without a Prisma code is not transient', () => {
	assert.equal(isTransientDbError(new Error('boom')), false)
	assert.equal(isTransientDbError('P1001'), false)
	assert.equal(isTransientDbError(null), false)
})
