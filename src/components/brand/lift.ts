// The design's hover on its filled actions: the button rises 2px and casts a
// glow in the accent. The shadow is a hover state, never at rest.
export const lift =
	'transition-[color,background-color,translate,scale,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-8px_var(--glow)] motion-reduce:hover:translate-y-0'
