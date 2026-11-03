import { Bricolage_Grotesque, Inter } from 'next/font/google'
import { cn } from '@/lib/cn'

// The redesign's two faces, loaded only on the pages that wear it, so the
// app's screens don't download them. Both are variable fonts, so every weight
// the design uses comes from one file each. Bricolage also carries its
// optical-size axis, as the design loads it: the browser picks the size from
// the text, so large headings get the tighter display cut.
const bricolage = Bricolage_Grotesque({
	subsets: ['latin'],
	axes: ['opsz'],
	variable: '--font-bricolage',
	display: 'swap'
})
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

// Puts a page in the redesign's scheme (.theme-brand in globals.css): the
// home page and the sign-in pages, for now.
export function BrandTheme({
	children,
	className
}: {
	children: React.ReactNode
	className?: string
}) {
	return (
		<div
			className={cn(
				'theme-brand min-h-svh overflow-x-clip',
				bricolage.variable,
				inter.variable,
				className
			)}
		>
			{children}
		</div>
	)
}
