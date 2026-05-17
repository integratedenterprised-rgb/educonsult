# Design System

Reusable component library organized by **atomic design** tiers. Every primitive:

- Is built with **CVA** for variant management
- Reads from the **theme CSS variables** (admin-editable palette)
- Wraps **Radix UI** primitives where stateful behavior is needed (a11y for free)
- Accepts standard HTML props in addition to its variant props (dynamic / CMS use)

```
components/ui/
├── atoms/         Irreducible, presentational primitives
├── molecules/     Compositions of atoms with a small shared concern
├── organisms/     Stateful, overlay-bearing widgets
├── index.ts       Barrel — import primitives from "@/components/ui"
└── README.md      This file
```

## Inventory

### Atoms
| Component | Variants | Notes |
| --- | --- | --- |
| `Button` | `primary` · `secondary` · `ghost` · `danger` · `outline` · `link` | `size: sm/md/lg/icon`, `loading`, `fullWidth`, `asChild` |
| `Input` | `size: sm/md/lg`, `state: default/error/success` | Auto-derives `state: error` from `aria-invalid` |
| `Textarea` | `size: sm/md/lg`, `state: default/error/success`, `resize: none/vertical/both` | Auto-derives `state: error` from `aria-invalid` |
| `Label` | — | Radix Label primitive |
| `Switch` | — | Radix Switch |
| `Skeleton` | `shape: rect/circle/text/pill` | `animate-pulse` placeholder, `aria-hidden` |
| `Badge` | `primary` · `secondary` · `ghost` · `danger` · `success` · `warning` · `outline` | |
| `Heading` | `size: lg → 6xl`, `weight`, `align`, `level: 1–6` | Semantic level decoupled from visual size |
| `Text` | `size`, `weight`, `tone`, `align`, `truncate` | Renders `<p>` by default; `as` prop for `span/div/label` |
| `Spinner` | `size: xs/sm/md/lg/xl` | Loader2 icon with `role="status"` |

### Molecules
| Component | Variants | Composition |
| --- | --- | --- |
| `Field` | — | `Label` + control slot + error/hint |
| `Card` | `variant: elevated/outlined/ghost`, `padding: none/sm/md/lg`, `interactive` | `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter`; padding cascades via CSS var |
| `Select` | — | Radix Select compound (`Trigger`, `Content`, `Item`, …) |
| `Container` | `width: narrow/default/wide/full` | Responsive max-width + horizontal padding |
| `SectionWrapper` | `paddingY: none/sm/md/lg/xl`, `background: default/muted/primary/card` | CMS section frame — accepts `settings` JSON or explicit props |

### Organisms
| Component | Variants | Behavior |
| --- | --- | --- |
| `Dialog` | — | Modal with overlay, focus trap, ESC-to-close |
| `Drawer` | `side: top/right/bottom/left` | Side-mounted overlay — same a11y as Dialog |
| `DropdownMenu` | item `destructive` | Radix dropdown, supports sub-menus |
| `Tabs` | List `variant: default/underline/pills` | Variant propagates from List to all Triggers via context |
| `Accordion` | — | Radix accordion (single or multiple) |

## Tokens

All design values are typed in [`src/lib/design-tokens.ts`](../../lib/design-tokens.ts):

- **Colors** — 19 semantic tokens (`primary`, `card`, `border`, etc.) backed by HSL CSS variables editable from the admin theme panel
- **Spacing** — Tailwind's 4px-step scale, typed for runtime consumers
- **Radius** — composes off `--radius`, also admin-editable
- **Shadow** — `sm/md/lg/xl` levels
- **Z-index** — central stack: `dropdown < sticky < modal < popover < toast < tooltip`
- **Breakpoints** — sync with `tailwind.config.ts`
- **Font sizes** — `xs → 6xl`

## Variant policy

The spec calls for these six variants across the system:

| Variant   | Where it shows up |
| --------- | ----------------- |
| Primary   | `Button`, `Badge`, `Text` (`tone="primary"`) |
| Secondary | `Button`, `Badge`         |
| Ghost     | `Button`, `Badge`, `Card` |
| Danger    | `Button` (`variant="danger"`), `Badge`, `Text` (`tone="danger"`), `Input/Textarea` (`state="error"`) |
| Loading   | `Button` (`loading` prop), `Spinner`, `Skeleton` |
| Disabled  | Native `disabled` on all interactive atoms — Radix handles aria automatically |

## Accessibility

- Radix primitives provide focus management, ARIA attributes, keyboard nav, and screen-reader announcements
- `Button` declares `aria-busy` while `loading`
- `Spinner` uses `role="status"` + visually-hidden `Loading` label
- Color tokens include `*-foreground` pairs to keep contrast pairings explicit
- Focus rings (`focus-visible:ring-ring`) are styled via the active theme so they remain visible in any palette

## Adding a new primitive

1. Pick the atomic tier: atom (no internal composition), molecule (composes atoms), or organism (stateful / overlay)
2. Use **CVA** for variants — match the spec variants where applicable
3. Add the export to [`index.ts`](./index.ts)
4. Add a row to the Inventory table above
