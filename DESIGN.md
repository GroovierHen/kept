# Design system — starter, not a brand

This is a **skeleton**, not a finished visual identity. It exists so a new
project starts from real conventions instead of an empty `globals.css` and
ad hoc Tailwind classes — not to pre-decide what this specific product
should look like. Replace the token _values_ freely; keep the token
_structure_ (semantic names, categories, where things live) unless you have
a specific reason not to, since `docs/rules/code-style.md` and the
`cn()`/`cva` conventions below assume it.

**Once this project has a real visual direction** (a mockup, a Figma file,
or a hand-designed comp), don't keep hand-maintaining this file — the
`impeccable` tooling (see the `impeccable` skill family) derives a proper
`DESIGN.md` from a finished build, including a token JSON sidecar: a fully-specified identity
with named colors, a type scale, and per-component tokens, extracted from
the build. This file is the "day one, nothing built yet" starting point;
that's the "day 200, ship it" end state.

## 1. Tokens live in `src/app/globals.css`'s `@theme` block

Not a `tailwind.config.js` — Tailwind v4 is CSS-first, tokens are CSS
custom properties. Two categories:

- **Sizing/spacing** — use Tailwind's built-in scale (`p-4`, `gap-2`,
  `text-lg`, ...) rather than inventing a parallel one. It's already a
  token system; redefining it is the more common design-system mistake,
  not a missing piece.
- **Everything brand-specific** — color, radius, shadow, font family — goes
  in `@theme` as semantic custom properties, not literal Tailwind class
  overrides scattered through components.

## 2. Name tokens by role, not by value

`--accent`, not `--blue-500`. A rename should never cascade through every
component that uses it.

Kept has one scheme: a white ground, bottle green text, and bottle green
as the accent. It is light whatever the OS preference, so there is no
light/dark pair to swap.

| Token                                      | Value                   | Role                                                                   |
| ------------------------------------------ | ----------------------- | ---------------------------------------------------------------------- |
| `--bg`                                     | `#ffffff` white         | page background                                                        |
| `--surface`                                | `#e8efe9`               | card/panel background, one step off `--bg`                             |
| `--surface-hover`                          | `#d8e3da`               | hover state for interactive surfaces, progress tracks                  |
| `--border`                                 | `#6b8a75`               | edges of cards, inputs and controls; 3:1 or more on `bg` and `surface` |
| `--border-strong`                          | `#4d6f58`               | hover/focus-adjacent border, table header rules                        |
| `--text`                                   | `#0a2214` bottle green  | what you read: headings, body, figures                                 |
| `--text-muted`                             | `#3d5545`               | labels and secondary copy                                              |
| `--text-faint`                             | `#4f6657`               | timestamps, counts, placeholders                                       |
| `--accent`                                 | `#133621` bottle green  | the one thing to press on a screen, and focus rings                    |
| `--accent-hover`                           | `#1f4d31`               | accent hover state                                                     |
| `--accent-ink`                             | `#ffffff`               | text/icon colour placed on top of an `--accent` surface                |
| `--success` / `--warning` / `--danger`     | green / amber / red     | status only, never used decoratively                                   |
| `--field-1` … `--field-4`                  | gold, ochre, two greens | flat bands on the home page, each with its own `--field-N-ink`         |
| `--radius-sm` / `--radius` / `--radius-lg` | 2px / 4px / 6px         | never hardcode a `border-radius` outside these                         |

### How the colours are used

Gold used to be the text colour as well as the accent, so body copy and the
primary button were the same ink and nothing on a screen could stand out.
The ground is now white, text is bottle green, and a filled bottle green
button means "press this". Gold stays in the brand as `--field-1`. Two
rules keep each colour meaning one thing:

- **One accent per screen.** Only the primary action is a filled green
  button. A selected choice turns gold (`--field-1`), a progress bar fills
  with `text` on a `surface-hover` track, and a second button uses the
  `secondary` or `outline` variant.
- **Three text tiers, chosen on purpose.** `text` for what you read,
  `text-muted` for labels and secondary copy, `text-faint` for timestamps
  and counts. A heading gets no colour class at all: it inherits `text`
  from `body`.

The home page's field bands use gold and green as a section's ground, not
as something to press.

## 3. Component conventions

- Build variant components (buttons, badges, alerts — anything with more
  than two visual states) with `class-variance-authority` (`cva`), not a
  chain of ternaries in `className`. Compose the result through `cn()`
  (`src/lib/cn.ts`, `clsx` + `tailwind-merge`) so a caller can still
  override/extend classes without Tailwind's cascade fighting itself.
- No hardcoded hex colors, pixel radii, or arbitrary spacing values in
  component code — if a value isn't expressible with an existing token or
  Tailwind's default scale, that's a signal to add a token, not to reach
  for `style={{ ... }}` or a one-off `bg-[#...]`.
- Every interactive element gets a visible `:focus-visible` state — the
  default browser outline is acceptable; removing it without replacing it
  is not.
- Respect `prefers-reduced-motion` for any animation beyond a simple
  opacity/color transition.

## 4. Shared design pieces

Both halves of Kept build their screens from these four, all in
`src/components/ui/`. Reach for them before writing a new panel, picker or £
figure.

| Piece         | Import                         | Use it for                                                                                         |
| ------------- | ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `StepCard`    | `@/components/ui/step-card`    | The panel one step of setup or a check-in sits in. `active` shows its children, `done` its summary |
| `ChoiceGroup` | `@/components/ui/choice-group` | Big tap targets for picking one: Yes/Partly/No, promises, moments, multiple choice answers         |
| `Money`       | `@/components/ui/money`        | Every £ figure on screen: `<Money pence={250} per="day" />` shows "£2.50 a day"                    |
| `ProgressBar` | `@/components/ui/progress-bar` | How far something gets toward a target. It stops at 100%                                           |

- `Money` takes pence, as they are stored. `isRounded` shows whole pounds, for
  figures shown as "about", and keeps pence under £1 ("65p"). For a £ figure
  inside a plain string, use `formatPence` from `@/lib/money`.
- `Money` sets no colour, so it reads correctly on whatever it sits on,
  including a selected choice. Don't give it a muted colour inside a
  `ChoiceGroup`.
- `ChoiceGroup`'s `label` is read out by screen readers but not shown, so put
  the visible question nearby.

## 5. Accessibility baseline

- Text-on-`--bg`/`--surface` must hit at least WCAG AA contrast (4.5:1 for
  body text, 3:1 for large text). Check this when you change a token value,
  not just when you add a new component.
- Every form input has an associated `<label>` (visually hidden is fine,
  absent is not).
- Icon-only buttons get an `aria-label`.
