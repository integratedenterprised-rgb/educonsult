# Migration Strategy

The schema in `prisma/schema.prisma` is the target. The database currently
in production runs the **bootstrap subset** (User, Page with `sections JSON`
and inline SEO, NavMenu, FooterColumn, SiteSetting, SiteTheme). This document
explains how to get from there to the target without downtime or data loss.

## Principles

1. **Additive first.** Every phase adds new tables/columns. Drops happen only
   after backfill verification.
2. **Backward-compatible.** Transitional fields (`Page.sectionsLegacy`,
   inline `seoTitle/...`) stay until consumers stop reading them.
3. **One migration per phase.** Multi-step deploys with manual gates between
   them — every phase is rollback-safe on its own.
4. **Backfills run idempotently.** Re-runnable scripts; safe to abort and
   resume.

## Phases

### Phase 0 — Inventory & freeze (no schema changes)

Goal: snapshot the source of truth before mutating it.

- `pg_dump --schema-only` + `pg_dump --data-only` to a versioned backup
- Annotate every consumer of `Page.sections`, `Page.seoTitle/...` so the cutover
  doesn't miss any read path (`grep -rn "page.sections" src/`)
- Freeze schema PRs not on this migration track

### Phase 1 — Additive structural migration

Goal: introduce every new table and column. No data movement yet.

Run via Prisma:

```bash
pnpm prisma migrate dev --name cms_target_additive
```

This generates one SQL migration that:

- Creates `SeoMeta`, `SeoMetaTranslation`
- Creates `Section`, `SectionTranslation`, `SectionComponent`,
  `SectionCountryCard`, `SectionTestimonial`, `SectionResource`,
  `SectionCoursePathway`
- Creates `HeroSection`, `HeroSectionTranslation`
- Creates `CtaBlock`, `CtaBlockTranslation`
- Creates `Component`, `ComponentTranslation`
- Creates `Country`, `CountryTranslation`
- Creates `Testimonial`, `TestimonialTranslation`
- Creates `Author`, `AuthorTranslation`
- Creates `BlogPost`, `BlogPostTranslation`, `BlogPostVersion`,
  `BlogPostCategory`, `BlogPostTag`
- Creates `Category`, `CategoryTranslation`, `Tag`
- Creates `Resource`, `ResourceTranslation`
- Creates `CoursePathway`, `CoursePathwayTranslation`, `PathwayRequirement`,
  `PathwayRequirementTranslation`
- Creates `VisaRiskRule`, `VisaRiskRuleTranslation`
- Creates `LeadForm`, `LeadFormField`, `LeadFormTranslation`,
  `LeadFormFieldTranslation`, `LeadSubmission`
- Creates `PageVersion`, `PageTranslation`
- Creates `NavItemTranslation`, `FooterColumnTranslation`, `FooterLinkTranslation`
- Creates `SiteSettingTranslation`
- Creates `Redirect`
- Adds nullable `seoId` columns on Page, BlogPost (no row yet),
  Country, Category, Resource, CoursePathway
- Adds nullable `parentId`, `scheduledAt` on Page
- Adds nullable `pageId` FK on NavItem and FooterLink
- Keeps `Page.sections`/`Page.seoTitle/...` intact

Verification:

```sql
SELECT COUNT(*) FROM "Page";                -- unchanged
SELECT COUNT(*) FROM "Section";             -- 0
SELECT to_regclass('public."SeoMeta"');     -- table exists
```

Rollback: `pnpm prisma migrate resolve --rolled-back <name>` then revert deploy.

### Phase 2 — Backfill: JSON sections → relational

Goal: populate `Section`, `HeroSection`, `CtaBlock`, etc. from existing
`Page.sectionsLegacy` JSON.

Implement `prisma/migrations/backfill/2024xxxx_sections.ts`:

```ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

interface LegacySection {
  id: string;
  type: string;
  order: number;
  isVisible?: boolean;
  anchor?: string;
  settings?: Record<string, unknown>;
  data: Record<string, unknown>;
}

for (const page of await prisma.page.findMany({ where: { deletedAt: null } })) {
  const legacy = (page.sectionsLegacy as unknown as LegacySection[]) ?? [];
  for (const l of legacy) {
    const created = await prisma.section.create({
      data: {
        pageId: page.id,
        type: mapType(l.type),           // "hero" → "HERO"
        order: l.order,
        isVisible: l.isVisible ?? true,
        anchor: l.anchor,
        settings: l.settings ?? null,
      },
    });

    switch (l.type) {
      case "hero":
        await prisma.heroSection.create({
          data: {
            section: { connect: { id: created.id } }, // 1:1 via Section.heroId
            backgroundImage: l.data.backgroundImage as string | undefined,
            primaryCtaUrl: (l.data.primaryCta as { url?: string } | undefined)?.url,
            // translations seeded with default locale row
            translations: {
              create: [{
                locale: "EN",
                headline: l.data.headline as string,
                subheadline: l.data.subheadline as string | undefined,
                eyebrow: l.data.eyebrow as string | undefined,
                primaryCtaLabel: (l.data.primaryCta as { label?: string } | undefined)?.label,
                secondaryCtaLabel: (l.data.secondaryCta as { label?: string } | undefined)?.label,
              }],
            },
          },
        });
        break;
      // … cta, testimonials, countryGrid, stats, faq, leadForm
    }
  }
}
```

Run:

```bash
tsx prisma/migrations/backfill/2024xxxx_sections.ts
```

Verification:

```sql
-- Every page should have at least as many sections as its JSON had elements
SELECT p.id, p.slug, jsonb_array_length(p."sectionsLegacy") AS json_count,
       (SELECT COUNT(*) FROM "Section" s WHERE s."pageId" = p.id) AS rel_count
FROM "Page" p
WHERE p."deletedAt" IS NULL
ORDER BY p.slug;
```

Rollback: `TRUNCATE "Section", "HeroSection", "CtaBlock", … CASCADE;` —
the `sectionsLegacy` column still has the source data.

### Phase 3 — Backfill: inline SEO → SeoMeta

Goal: create a `SeoMeta` row per `Page` and `BlogPost` with non-null inline
SEO fields; copy values; link via `seoId`.

```ts
for (const page of await prisma.page.findMany({
  where: { deletedAt: null, seoId: null },
})) {
  if (!page.seoTitle && !page.seoDescription && !page.seoKeywords && !page.ogImageUrl) {
    continue; // nothing to migrate
  }
  const seo = await prisma.seoMeta.create({
    data: {
      ogImageUrl: page.ogImageUrl,
      translations: {
        create: [{
          locale: "EN",
          title: page.seoTitle ?? page.title,
          description: page.seoDescription,
          keywords: page.seoKeywords,
        }],
      },
    },
  });
  await prisma.page.update({ where: { id: page.id }, data: { seoId: seo.id } });
}
```

Verification:

```sql
SELECT COUNT(*) FROM "Page" p WHERE p."seoId" IS NULL AND (
  p."seoTitle" IS NOT NULL OR p."seoDescription" IS NOT NULL
);
-- Should return 0
```

### Phase 4 — Code cutover

Goal: switch every read path from legacy fields to the relational model.

Touch points (already audited in Phase 0):

| File | Change |
| ---- | ------ |
| `src/server/cms/page.service.ts` | Read `sections` via `prisma.section.findMany({ include: { hero: {...}, cta: {...}, … } })` |
| `src/server/cms/admin-page.service.ts` | `updatePage` writes to `Section[]` + typed blocks, not to `sectionsLegacy` JSON |
| `src/components/admin/page-editor/page-editor.tsx` | RHF schema now mirrors the relational shape; server action persists relational rows |
| `src/lib/seo.ts` | Prefer `page.seo.translations[locale]` over inline fields |
| `src/types/cms.ts` | `Section` union remains the public-facing shape; the service layer adapts the relational rows to it |

Deploy this phase **after** Phase 3 backfill completes in production. The
inline fields and `sectionsLegacy` still exist as the source of truth — if
anything is wrong, revert the code without touching the schema.

Run dual-read for a release cycle: production code reads the relational
data, falls back to legacy fields if a Page has no `Section` rows.

### Phase 5 — Drop legacy columns

Only after Phase 4 has been stable for ≥ 1 release cycle.

```bash
pnpm prisma migrate dev --name cms_drop_legacy
```

Generated SQL:

```sql
ALTER TABLE "Page" DROP COLUMN "sectionsLegacy";
ALTER TABLE "Page" DROP COLUMN "seoTitle";
ALTER TABLE "Page" DROP COLUMN "seoDescription";
ALTER TABLE "Page" DROP COLUMN "seoKeywords";
ALTER TABLE "Page" DROP COLUMN "ogImageUrl";
```

Update `prisma/schema.prisma`: remove the four inline SEO fields and
`sectionsLegacy`. Remove the `/// @deprecated` notes.

Rollback: keep the Phase 0 backup. If Phase 5 misfires, restore the dropped
columns from the snapshot — at this point no live code references them, so
revert is purely defensive.

## Locale backfill

When you light up a new locale (e.g., `NE`):

1. Insert `*Translation` rows for the new locale on every entity that should
   ship in that language. A repeatable script:
   ```ts
   for (const page of pagesInScope) {
     await prisma.pageTranslation.upsert({
       where: { pageId_locale: { pageId: page.id, locale: "NE" } },
       update: {},
       create: { pageId: page.id, locale: "NE",
                 title: translate(page.title, "NE"),
                 slug: slugify(translate(page.title, "NE")) },
     });
   }
   ```
2. Verify per-locale slug uniqueness: `SELECT COUNT(*) FROM "PageTranslation" GROUP BY locale, slug HAVING COUNT(*) > 1;`
3. Add the locale to the `Locale` enum if not present (Prisma migration)
4. Update `lib/config.ts → siteConfig.locales`

## Versioning enablement

`PageVersion` and `BlogPostVersion` are created empty in Phase 1. Versions
start accumulating once the editor writes a snapshot on each save:

```ts
await prisma.$transaction([
  prisma.page.update({ where: { id }, data: pageUpdate }),
  prisma.pageVersion.create({
    data: {
      pageId: id,
      version: { /* next number from MAX(version)+1 */ },
      snapshot: { /* serialized page state */ },
      changeNote,
      createdById: session.userId,
    },
  }),
]);
```

Retention: keep all versions for the first 100 saves per entity, then prune
to the last 50 via a nightly job — leaves room to restore from a few days
back without unbounded growth.

## Pre-flight checklist (each phase)

- [ ] Backup taken (`pg_dump`)
- [ ] Migration runs cleanly on a staging copy of production data
- [ ] Backfill script (if any) is idempotent — re-running it produces no
      additional rows
- [ ] Verification queries run green
- [ ] Code consumers updated (Phase 4 only)
- [ ] Rollback rehearsed once
