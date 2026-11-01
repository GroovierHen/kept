import { z } from 'zod'

// What the report step sends. The id is made by the page that asked.

export const REPORT_ANSWERS = ['yes', 'partly', 'no'] as const
export type ReportAnswer = (typeof REPORT_ANSWERS)[number]

export const reportSubmission = z.object({
	promiseId: z.uuid(),
	reportId: z.uuid(),
	answer: z.enum(REPORT_ANSWERS)
})

const SECOND_PERSON: Record<string, string> = { my: 'your', mine: 'yours', myself: 'yourself' }

/**
 * A Promise's wording as it reads inside "Did you … today?". Typed wording is
 * free text, so it may repeat the whole sentence the form shows.
 */
export function reportQuestionWording(wording: string): string {
	return wording
		.trim()
		.replace(/^(?:[^,]*,\s*)?i(?: will|'ll|’ll)\s+/i, '')
		.replace(/[.!]+$/, '')
		.replace(/^[A-Z](?=[a-z])/, (letter) => letter.toLowerCase())
		.replace(/\b(my|mine|myself)\b/gi, (word) => SECOND_PERSON[word.toLowerCase()] ?? word)
}
