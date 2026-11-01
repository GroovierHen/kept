import { connection } from 'next/server'
import { getTranslations } from 'next-intl/server'
import { SiteNav } from '@/components/landing/site-nav'
import { breadcrumbJsonLd, JsonLd } from '@/lib/seo/json-ld'
import { pageMetadata } from '@/lib/seo/metadata'
import { getResults } from '@/server/results/read-results'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
	return pageMetadata({ path: '/results', locale: (await params).locale })
}

function Section({
	id,
	heading,
	note,
	children
}: {
	id: string
	heading: string
	note: string
	children: React.ReactNode
}) {
	return (
		<section aria-labelledby={id} className="grid gap-6 md:grid-cols-12 md:gap-x-(--gutter)">
			<div className="flex flex-col gap-3 md:col-span-4">
				<h2 id={id} className="text-lead font-medium tracking-[-0.03em]">
					{heading}
				</h2>
				<p className="text-small text-text-muted max-w-[38ch]">{note}</p>
			</div>
			<div className="md:col-span-7 md:col-start-6">{children}</div>
		</section>
	)
}

function Counts({ counts }: { counts: readonly { label: string; value: number }[] }) {
	return (
		<dl className="flex flex-wrap gap-x-12 gap-y-6">
			{counts.map(({ label, value }) => (
				<div key={label} className="flex flex-col-reverse gap-1">
					<dt className="text-small text-text-muted">{label}</dt>
					<dd className="text-head font-medium tracking-[-0.05em] tabular-nums">{value}</dd>
				</div>
			))}
		</dl>
	)
}

function NumbersTable({
	columns,
	rows
}: {
	columns: readonly string[]
	rows: readonly (readonly [number, ...number[]])[]
}) {
	return (
		<table className="text-body w-full border-collapse tabular-nums">
			<thead>
				<tr className="border-border-strong text-small text-text-muted border-b text-left align-bottom">
					{columns.map((column) => (
						<th key={column} scope="col" className="pr-4 pb-2 font-normal">
							{column}
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{rows.map(([rowHeader, ...cells]) => (
					<tr key={rowHeader} className="border-border border-b">
						<th scope="row" className="py-2 pr-4 text-left font-normal">
							{rowHeader}
						</th>
						{cells.map((cell, index) => (
							<td key={columns[index + 1]} className="py-2 pr-4">
								{cell}
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	)
}

// Public proof for the judges: raw counts across all Testers, built from Events.
// A Server Component with no client code, so nothing but these numbers leaves the server.
export default async function ResultsPage() {
	// Read at request time, never at build: the numbers are live.
	await connection()
	const [{ results, recall }, t] = await Promise.all([getResults(), getTranslations('ResultsPage')])

	return (
		<>
			<SiteNav />
			<main className="flex flex-col gap-20 px-(--page-margin) pt-12 pb-28 md:gap-28 md:pt-20 md:pb-44">
				<div className="flex flex-col gap-6">
					<h1 className="text-head max-w-[16ch] font-medium tracking-[-0.05em]">{t('heading')}</h1>
					<p className="text-body max-w-[52ch]">{t('intro')}</p>
				</div>

				<Section id="people" heading={t('people.heading')} note={t('people.note')}>
					<Counts
						counts={[
							{ label: t('people.signedUp'), value: results.signedUp },
							{ label: t('people.started'), value: results.started }
						]}
					/>
				</Section>

				<Section id="checking-in" heading={t('checkingIn.heading')} note={t('checkingIn.note')}>
					{results.days.length === 0 ? (
						<p className="text-body text-text-muted">{t('checkingIn.empty')}</p>
					) : (
						<NumbersTable
							columns={[t('checkingIn.day'), t('checkingIn.checkedIn'), t('checkingIn.reached')]}
							rows={results.days.map(({ day, checkedIn, reached }) => [day, checkedIn, reached])}
						/>
					)}
				</Section>

				<Section id="promises" heading={t('promises.heading')} note={t('promises.note')}>
					<Counts
						counts={[
							{ label: t('promises.kept'), value: results.kept },
							{ label: t('promises.partly'), value: results.partly },
							{ label: t('promises.slipped'), value: results.slipped }
						]}
					/>
				</Section>

				<Section id="milestones" heading={t('milestones.heading')} note={t('milestones.note')}>
					<Counts counts={[{ label: t('milestones.reached'), value: results.milestonesReached }]} />
				</Section>

				<Section id="recall" heading={t('recall.heading')} note={t('recall.note')}>
					<div className="flex flex-col gap-8">
						{recall.ideas.length === 0 ? (
							<p className="text-body text-text-muted">{t('recall.empty')}</p>
						) : (
							<NumbersTable
								columns={[t('recall.idea'), t('recall.first'), t('recall.last')]}
								rows={recall.ideas.map(({ first, last }, index) => [index + 1, first, last])}
							/>
						)}
						<Counts counts={[{ label: t('recall.leftOut'), value: recall.leftOut }]} />
					</div>
				</Section>
			</main>
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: 'Home', path: '/' },
					{ name: 'Results', path: '/results' }
				])}
			/>
		</>
	)
}
