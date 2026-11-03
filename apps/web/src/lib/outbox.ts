import { backoffDelay } from './retry'

// Entries a person typed (a goal, a report, a recall answer) are saved on the
// device before they are sent, and stay there until the server confirms it has
// them. A dropped connection, a closed tab or an outage then delays an entry
// instead of losing it. Each entry's id is its idempotency key: the server
// saves an id once, so sending it again after a lost answer is safe.
//
// Never put a password or a session token in here; it is plain device storage.

const DEFAULT_BASE_DELAY_MS = 2000
const DEFAULT_MAX_DELAY_MS = 5 * 60 * 1000
const DEFAULT_MAX_ENTRIES = 50

export interface OutboxEntry {
	readonly id: string
	readonly kind: string
	readonly payload: unknown
	readonly createdAt: number
	readonly attempts: number
	readonly nextAttemptAt: number
}

/**
 * What the server made of an entry. `retry` for a network failure or a 5xx,
 * `rejected` for an answer that won't change, such as invalid input.
 */
export type SendResult = 'sent' | 'retry' | 'rejected'

export interface OutboxStore {
	load(): readonly OutboxEntry[]
	save(entries: readonly OutboxEntry[]): void
}

export interface FlushResult {
	readonly sent: number
	readonly waiting: number
	readonly rejected: readonly OutboxEntry[]
}

export class OutboxFullError extends Error {
	constructor(maxEntries: number) {
		super(`The outbox already holds ${maxEntries} entries waiting to be sent`)
		this.name = 'OutboxFullError'
	}
}

export function createOutbox({
	store,
	send,
	now = Date.now,
	random,
	newId = () => crypto.randomUUID(),
	baseDelayMs = DEFAULT_BASE_DELAY_MS,
	maxDelayMs = DEFAULT_MAX_DELAY_MS,
	maxEntries = DEFAULT_MAX_ENTRIES
}: {
	store: OutboxStore
	send: (entry: OutboxEntry) => Promise<SendResult>
	now?: () => number
	random?: () => number
	newId?: () => string
	baseDelayMs?: number
	maxDelayMs?: number
	maxEntries?: number
}) {
	let entries: OutboxEntry[] = [...store.load()]
	let savedOnDevice = true
	let flushing: Promise<FlushResult> | null = null

	function persist() {
		try {
			store.save(entries)
			savedOnDevice = true
		} catch {
			// Private browsing or a full disk: the entries still live in memory
			// and are sent this visit; isSavedOnDevice lets the screen say so.
			savedOnDevice = false
		}
	}

	async function sendDue(): Promise<FlushResult> {
		let sent = 0
		const rejected: OutboxEntry[] = []
		for (const entry of [...entries]) {
			if (entry.nextAttemptAt > now()) break
			let result: SendResult
			try {
				result = await send(entry)
			} catch {
				result = 'retry'
			}
			if (result === 'retry') {
				const attempts = entry.attempts + 1
				const delay = backoffDelay({ attempt: attempts, baseDelayMs, maxDelayMs, random })
				entries = entries.map((waiting) =>
					waiting.id === entry.id ? { ...waiting, attempts, nextAttemptAt: now() + delay } : waiting
				)
				persist()
				// Later entries wait too, so they still reach the server in the order typed.
				break
			}
			entries = entries.filter((waiting) => waiting.id !== entry.id)
			persist()
			if (result === 'sent') sent += 1
			else rejected.push(entry)
		}
		return { sent, waiting: entries.length, rejected }
	}

	return {
		/** Saves the entry on the device and returns it; send it with flush. */
		enqueue(kind: string, payload: unknown): OutboxEntry {
			if (entries.length >= maxEntries) throw new OutboxFullError(maxEntries)
			const entry: OutboxEntry = {
				id: newId(),
				kind,
				payload,
				createdAt: now(),
				attempts: 0,
				nextAttemptAt: now()
			}
			entries = [...entries, entry]
			persist()
			return entry
		},
		pending(): readonly OutboxEntry[] {
			return entries
		},
		isSavedOnDevice(): boolean {
			return savedOnDevice
		},
		/** Sends every entry that is due. A flush already running is shared, not doubled. */
		flush(): Promise<FlushResult> {
			flushing ??= sendDue().finally(() => {
				flushing = null
			})
			return flushing
		}
	}
}

export type Outbox = ReturnType<typeof createOutbox>

function isEntry(value: unknown): value is OutboxEntry {
	return (
		typeof value === 'object' &&
		value != null &&
		'id' in value &&
		typeof value.id === 'string' &&
		'kind' in value &&
		typeof value.kind === 'string' &&
		'payload' in value &&
		'createdAt' in value &&
		typeof value.createdAt === 'number' &&
		'attempts' in value &&
		typeof value.attempts === 'number' &&
		'nextAttemptAt' in value &&
		typeof value.nextAttemptAt === 'number'
	)
}

/**
 * The browser's localStorage under one key. Unreadable contents are kept
 * under a second key rather than overwritten, so nothing typed is destroyed.
 */
export function localStorageStore(key: string): OutboxStore {
	return {
		load() {
			let raw: string | null
			try {
				raw = window.localStorage.getItem(key)
			} catch {
				return []
			}
			if (raw == null) return []
			try {
				const parsed: unknown = JSON.parse(raw)
				if (Array.isArray(parsed) && parsed.every(isEntry)) return parsed
			} catch {
				// Falls through to keeping the unreadable copy below.
			}
			try {
				window.localStorage.setItem(`${key}:unreadable:${Date.now()}`, raw)
			} catch {
				// Nowhere to keep it; leave the original key untouched instead.
				return []
			}
			window.localStorage.removeItem(key)
			return []
		},
		save(entries) {
			if (entries.length === 0) window.localStorage.removeItem(key)
			else window.localStorage.setItem(key, JSON.stringify(entries))
		}
	}
}

/**
 * Sends waiting entries when the device comes back online, when the tab is
 * shown again, and on a timer. Returns a function that stops it.
 */
export function syncOutbox({
	outbox,
	onFlushed,
	intervalMs = 30_000
}: {
	outbox: Outbox
	onFlushed?: (result: FlushResult) => void
	intervalMs?: number
}): () => void {
	const run = () => {
		if (!navigator.onLine) return
		void outbox.flush().then(onFlushed)
	}
	const onVisible = () => {
		if (document.visibilityState === 'visible') run()
	}
	window.addEventListener('online', run)
	document.addEventListener('visibilitychange', onVisible)
	const timer = window.setInterval(run, intervalMs)
	run()
	return () => {
		window.removeEventListener('online', run)
		document.removeEventListener('visibilitychange', onVisible)
		window.clearInterval(timer)
	}
}
