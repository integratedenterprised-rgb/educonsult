# Dynamic Homepage Rendering Engine

The homepage is a Page row whose `sections` JSON column holds an ordered list
of typed `Section` objects. The same engine renders **every** page on the site
— there is no separate "homepage" code path, only data.

## End-to-end flow

```
   1. Admin saves a page in /admin/pages/{id}/edit
                ↓
   2. PATCH /api/admin/pages/{id}
        - validates sections via Zod (sectionSchema)
        - prisma.page.update({ sections: input.sections })
        - revalidateTag(`cms:page:${slug}`)
                ↓
   3. Next request to / (or /any-slug)
        - getHomepage() / getPageBySlug() — cached via unstable_cache
        - returns { sections: Section[], seo, … }
                ↓
   4. <SectionRenderer sections={page.sections}>
        - iterates ordered sections
        - filters out isVisible === false
        - for each: blockRegistry[section.type] → typed Block component
        - first section renders raw; subsequent wrap in <MotionFade>
                ↓
   5. Block component reads section.data and emits markup
        - uses design-system primitives (Heading, Text, Button, Card, Badge…)
        - reads theme via CSS variables (admin-editable)
```

Tag-based revalidation means an admin save is visible to the public within
the next request — typically under a second.

## Architecture pieces

### 1. Dynamic section renderer
`src/components/cms/section-renderer.tsx`

- Server Component (no `"use client"`)
- Iterates `Section[]`, sorted and visibility-filtered upstream by the
  service layer
- Looks up the block component in `blockRegistry`
- Wraps each block in `<SectionWrapper>` (handles padding / background /
  anchor / container width based on `section.settings`)
- First section renders without motion (above-fold); subsequent sections
  get viewport-triggered `<MotionFade>`

### 2. Component registry
`src/components/cms/block-registry.tsx`

```ts
type BlockRegistry = { [T in Section as T["type"]]: BlockComponent<T> };
```

A **mapped type over the discriminated union** — TypeScript enforces that
every variant of `Section` has a registered renderer. Forget to register a
new type and the build fails. No string-based lookup or unsafe `as` casts.

### 3. CMS section mapping
The CMS-side enum (`SectionType` in `prisma/schema.prisma`,
`SectionType` union in `src/types/cms.ts`) and the registry keys are
**1:1 with the public renderer**. The mapping is:

| CMS type           | Block component        | Purpose                            |
| ------------------ | ---------------------- | ---------------------------------- |
| `hero`             | `HeroBlock`            | Above-fold headline + CTAs         |
| `stats`            | `StatsBlock`           | Big-number metrics row             |
| `countryGrid`      | `CountryGridBlock`     | Destination cards                  |
| `eligibility`      | `EligibilityBlock`     | Criteria checklist + CTA           |
| `coursePathways`   | `CoursePathwaysBlock`  | Curated pathway cards              |
| `visaRisk`         | `VisaRiskBlock`        | Risk-factor cards (low/med/high)   |
| `testimonials`     | `TestimonialsBlock`    | Student quotes                     |
| `resources`        | `ResourcesBlock`       | PDF / video / template cards       |
| `faq`              | `FaqBlock`             | Collapsible Q&A                    |
| `richText`         | `RichTextBlock`        | HTML body                          |
| `cta`              | `CtaBlock`             | Bold call-to-action banner         |
| `leadForm`         | `LeadFormBlock`        | Embedded lead form                 |

### 4. Section ordering system
`Section.order` is a stable integer per section. The page editor's drag-and-drop
re-sequences via `useFieldArray.move`. On save, the API normalizes order to
match array position. The public read service sorts by `order` ascending,
so reordering in the editor is reflected on the next request.

### 5. Dynamic props architecture
Each block is `(props: { section: SpecificSectionType }) => JSX.Element`.
The block type carries its own `data` shape — `HeroBlock` consumes
`HeroSection`, `EligibilityBlock` consumes `EligibilitySection`. No prop
adapters or runtime introspection.

`SectionSettings` is the cross-cutting prop slot — `paddingY`,
`background`, `containerWidth`, and arbitrary extensions go in
`section.settings`. The settings panel in the admin lets you tune these
per section without touching block data.

## Adding a new section type

Three steps, enforced by the type system:

1. **Extend the union** in `src/types/cms.ts`:
   ```ts
   export interface NewSection extends BaseSection {
     type: "newType";
     data: { /* … */ };
   }
   ```
   Add `"newType"` to `SectionType` and `NewSection` to the `Section` union.

2. **Add a Zod schema** in `src/lib/validators/section.ts`:
   ```ts
   export const newDataSchema = z.object({ /* … */ });
   ```
   And add it to `sectionSchema` discriminated union.

3. **Drop in a renderer** at `src/components/cms/blocks/new-block.tsx`,
   then register it in `block-registry.tsx`. Add a `BLOCK_META` entry and
   an editor form to make it authorable.

If you forget step 3, the registry's mapped type fails compile-time —
the build catches the gap before runtime.

## Admin capabilities

| Admin action          | Mechanism                                            |
| --------------------- | ---------------------------------------------------- |
| Reorder sections      | DnD on the editor; `useFieldArray.move`              |
| Enable / disable      | `section.isVisible` toggle (eye icon on card)        |
| Edit text / images    | Per-block form (RHF + Zod, one file per block type)  |
| Edit CTAs / buttons   | Same form — every block exposes its CTAs            |
| Adjust layout         | `SectionSettings` panel (padding, background, width) |
| Add new section type  | Three files (above) — no central dispatcher to touch |

## Caching & instant updates

| Tag                  | What invalidates it                          |
| -------------------- | -------------------------------------------- |
| `cms:page:home`      | Homepage save                                |
| `cms:page:{slug}`    | Save for the page with that slug             |
| `cms:nav`            | Header or footer menu save                   |
| `cms:settings`       | Site settings save (name / contact / social) |
| `cms:theme`          | Theme picker / theme editor save             |

All admin saves call `revalidateTag` so the next public request hits the
database and re-renders. No CDN purge step.

## Seed

`prisma/seed.ts` pre-populates the homepage with one section of each spec
type so the engine can be eyeballed immediately:

```
Hero → Stats → CountryGrid → Eligibility → CoursePathways →
VisaRisk → Testimonials → Resources → CTA
```

Re-running the seed replaces the homepage's sections (idempotent upsert).
