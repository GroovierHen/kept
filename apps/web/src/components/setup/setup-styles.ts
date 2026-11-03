// Classes the setup screens share, so every step's button, field and choice
// reads the same. They assume the brand theme <SetupShell> puts the page in.

export const SETUP_BUTTON = 'h-14 w-full gap-2.5 rounded-[14px] text-[17px] font-semibold'

export const SETUP_SECONDARY_BUTTON =
	'h-14 rounded-[14px] border-border-strong px-[22px] text-[16px] font-semibold'

export const SETUP_FIELD =
	'border-border-strong rounded-[20px] border-[1.5px] px-[22px] py-5 text-[19px] leading-normal focus-visible:outline-accent'

/** A choice in a stacked list: the pick is outlined in green on a pale green ground. */
export const SETUP_CHOICE =
	'min-h-16 rounded-2xl border-2 border-border bg-surface px-[18px] py-3.5 text-[16px] font-medium hover:border-accent hover:bg-surface data-[state=checked]:border-accent data-[state=checked]:bg-accent-soft data-[state=checked]:text-text'

/** A choice in a grid of large tiles: the pick fills green. */
export const SETUP_TILE =
	'min-h-[132px] rounded-[20px] border-2 border-border-strong bg-surface p-5 text-left hover:border-accent hover:bg-surface data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-ink'
