import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createOutbox, OutboxFullError, type OutboxEntry, type OutboxStore } from './outbox.ts'

function memoryStore(initial: OutboxEntry[] = []) {
	let saved = initial
	const store: OutboxStore = {
		load: () => saved,
		save: (entries) => {
			saved = entries
		}
	}
	return { store, saved: () => saved }
}

let ids = 0
const newId = () => `entry-${(ids += 1)}`

test('an entry is saved on the device before anything is sent', () => {
	const { store, saved } = memoryStore()
	const outbox = createOutbox({ store, send: async () => 'sent', newId })
	const entry = outbox.enqueue('report', { answer: 'yes' })
	assert.deepEqual(
		saved().map((saved) => saved.id),
		[entry.id]
	)
})

test('entries survive a reload of the page', () => {
	const { store } = memoryStore()
	createOutbox({ store, send: async () => 'sent', newId }).enqueue('report', { answer: 'yes' })
	const reloaded = createOutbox({ store, send: async () => 'sent', newId })
	assert.equal(reloaded.pending().length, 1)
})

test('a flush sends due entries in order and removes them once the server has them', async () => {
	const { store, saved } = memoryStore()
	const sent: string[] = []
	const outbox = createOutbox({
		store,
		newId,
		send: async (entry) => {
			sent.push(entry.kind)
			return 'sent'
		}
	})
	outbox.enqueue('report', {})
	outbox.enqueue('recall', {})
	const result = await outbox.flush()
	assert.deepEqual(sent, ['report', 'recall'])
	assert.equal(result.sent, 2)
	assert.deepEqual(saved(), [])
})

test('a failed send keeps the entry, waits longer each time, and holds back later entries', async () => {
	const { store } = memoryStore()
	let clock = 1_000
	const sent: string[] = []
	const outbox = createOutbox({
		store,
		newId,
		now: () => clock,
		random: () => 1,
		baseDelayMs: 1000,
		maxDelayMs: 60_000,
		send: async (entry) => {
			sent.push(entry.kind)
			return 'retry'
		}
	})
	outbox.enqueue('report', {})
	outbox.enqueue('recall', {})

	await outbox.flush()
	assert.deepEqual(sent, ['report'])
	const [first] = outbox.pending()
	assert.equal(first.attempts, 1)
	assert.equal(first.nextAttemptAt, 2_000)

	await outbox.flush()
	assert.deepEqual(sent, ['report'], 'not due yet, so not sent again')

	clock = 2_000
	await outbox.flush()
	assert.equal(outbox.pending()[0].nextAttemptAt, 4_000)
})

test('a send that throws, such as a dropped network, counts as a retry', async () => {
	const { store } = memoryStore()
	const outbox = createOutbox({
		store,
		newId,
		send: async () => {
			throw new TypeError('Failed to fetch')
		}
	})
	outbox.enqueue('report', {})
	const result = await outbox.flush()
	assert.equal(result.waiting, 1)
	assert.equal(outbox.pending().length, 1)
})

test('an entry the server refuses is removed and handed back to show the person', async () => {
	const { store } = memoryStore()
	const outbox = createOutbox({ store, newId, send: async () => 'rejected' })
	const entry = outbox.enqueue('report', {})
	const result = await outbox.flush()
	assert.deepEqual(
		result.rejected.map((rejected) => rejected.id),
		[entry.id]
	)
	assert.equal(outbox.pending().length, 0)
})

test('an entry keeps the same id on every try, so the server can save it once', async () => {
	const { store } = memoryStore()
	const seen: string[] = []
	let calls = 0
	const outbox = createOutbox({
		store,
		newId,
		random: () => 0,
		send: async (entry) => {
			seen.push(entry.id)
			calls += 1
			return calls < 3 ? 'retry' : 'sent'
		}
	})
	outbox.enqueue('report', {})
	await outbox.flush()
	await outbox.flush()
	await outbox.flush()
	assert.equal(new Set(seen).size, 1)
})

test('two flushes at once send an entry once', async () => {
	const { store } = memoryStore()
	let sends = 0
	const outbox = createOutbox({
		store,
		newId,
		send: async () => {
			sends += 1
			await new Promise((resolve) => setTimeout(resolve, 5))
			return 'sent'
		}
	})
	outbox.enqueue('report', {})
	await Promise.all([outbox.flush(), outbox.flush()])
	assert.equal(sends, 1)
})

test('a full outbox refuses a new entry instead of dropping an old one', () => {
	const { store } = memoryStore()
	const outbox = createOutbox({ store, newId, maxEntries: 2, send: async () => 'sent' })
	outbox.enqueue('report', {})
	outbox.enqueue('report', {})
	assert.throws(() => outbox.enqueue('report', {}), OutboxFullError)
	assert.equal(outbox.pending().length, 2)
})

test('when the device refuses to store, entries stay in memory and say so', async () => {
	const store: OutboxStore = {
		load: () => [],
		save: () => {
			throw new Error('QuotaExceededError')
		}
	}
	const outbox = createOutbox({ store, newId, send: async () => 'sent' })
	outbox.enqueue('report', {})
	assert.equal(outbox.isSavedOnDevice(), false)
	assert.equal(outbox.pending().length, 1)
	assert.equal((await outbox.flush()).sent, 1)
})
