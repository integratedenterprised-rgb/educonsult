# SEO Infrastructure

End-to-end SEO is wired into the rendering pipeline. Every public route emits
typed metadata, JSON-LD structured data, and contributes to the sitemap —
with no per-page boilerplate beyond passing CMS values to `buildMetadata`.

## Surface

```
┌── lib/seo/ ────────────────────────────────────────────────┐
│   metadata.ts        buildMetadata, absoluteUrl            │
│   json-ld.ts         organizationJsonLd, websiteJsonLd,    │
│                      webPageJsonLd, articleJsonLd,         │
│                      courseJsonLd, breadcrumbJsonLd,       │
│                      faqJsonLd, reviewJsonLd               │
│   slug.ts            slugify, slugFromQuery, isValidSlug   │
│   score.ts           scoreSeo (0–100 + issue list)         │
│   internal-links.ts  autoInternalLink + DEFAULT_LINK_RULES │
│   index.ts           barrel                                │
└────────────────────────────────────────────────────────────┘
┌── components/seo/ ─────────────────────────────────────────┐
│   json-ld.tsx        <JsonLd data={…}>  (server, prunes    │
│                      undefined/null/empty values)          │
│   breadcrumbs.tsx    <Breadcrumbs items={…}> + JSON-LD;    │
│                      breadcrumbsFromSlugPath() helper      │
└────────────────────────────────────────────────────────────┘
```

## Rendering pipeline

```
  app/layout.tsx (server)
    ├─ generateMetadata() — fallback title/desc from SiteSetting
    ├─ <head>
    │   ├─ <ThemeStyle />
    │   └─ <JsonLd data={[organizationJsonLd, websiteJsonLd]} />     ← site-wide
    │
  app/(site)/page.tsx (homepage)
    ├─ generateMetadata() — page.seo with site fallback
    └─ <JsonLd data={webPageJsonLd(...)} />                          ← per-page
       <SectionRenderer sections={page.sections} />
         └─ FaqBlock auto-emits <JsonLd data={faqJsonLd(...)} />     ← block-level
  app/(site)/[...slug]/page.tsx (catch-all)
    └─ Same + <Breadcrumbs /> (renders trail + BreadcrumbList JSON-LD)
```

Search engines parse each `application/ld+json` script independently — Page +
Breadcrumb + FAQ can coexist and produce distinct rich-result eligibility.

## Schema catalog

| Type                | Where emitted                              | Why |
| ------------------- | ------------------------------------------ | --- |
| `EducationalOrganization` | Root layout                          | Establishes the brand entity for Knowledge Graph |
| `WebSite`           | Root layout                                | Surfaces the sitelinks search box |
| `WebPage`           | Each public route                          | Baseline page metadata |
| `BreadcrumbList`    | `<Breadcrumbs />` on `[...slug]` routes    | Drives the breadcrumb trail in SERPs |
| `FAQPage`           | `FaqBlock` whenever it has items           | Auto rich results for Q&A content |
| `Article`           | Blog post pages (planned)                  | News / blog rich results |
| `Course`            | Course pathway pages (planned)             | Education-vertical rich results |
| `Review`            | Testimonial entities (planned)             | Aggregate review stars (when paired with `AggregateRating`) |

## Metadata defaults

`buildMetadata({...}, siteName)` returns a Next.js `Metadata` with:

- `title` + template `"%s — siteName"`
- `description`, `keywords`
- `metadataBase` for resolving relative URLs
- `alternates.canonical` from `canonicalPath`
- `robots: { index: !noIndex, follow: !noIndex }`
- **OpenGraph**: `url`, `title`, `description`, `siteName`, `images`, plus
  article extras (`publishedTime`, `modifiedTime`, `authors`) when `ogType="article"`
- **Twitter**: `summary_large_image` card with title/description/image

Every public page in the codebase already calls this — the SEO panel in the
admin editor is the single source of truth.

## Sitemap

`app/sitemap.ts` enumerates every PUBLISHED page (`deletedAt IS NULL`) and
emits `<url>` entries with:

| Field             | Derivation                                                   |
| ----------------- | ------------------------------------------------------------ |
| `url`             | `siteConfig.url + "/" + slug` (or `/` for homepage)          |
| `lastModified`    | `page.updatedAt` — admin edits bump it automatically         |
| `changeFrequency` | Heuristic by `template`: home daily, seo-landing weekly, country/pathway monthly, legal yearly |
| `priority`        | Homepage 1.0, landings 0.85, country/pathway 0.8, legal 0.3  |

Revalidates hourly. Blog posts, countries, course pathways, and resources
are stubbed for after Phase 1 of the migration (see MIGRATION-STRATEGY.md).

## robots.txt

- `*` allow; disallow `/admin` and `/api`
- Explicit allow for `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` —
  documents AI-crawler policy in source rather than buried in a config file

## Programmatic SEO landing pages

Five seeded pages target high-intent search queries:

| Slug                                 | Target query                        |
| ------------------------------------ | ----------------------------------- |
| `/study-in-australia-from-nepal`     | "study in Australia from Nepal"     |
| `/study-in-canada-from-nepal`        | "study in Canada from Nepal"        |
| `/australia-student-visa-nepal`      | "Australia student visa Nepal"      |
| `/canada-visa-rejection-nepal`       | "Canada visa rejection Nepal"       |
| `/study-gap-australia`               | "study gap Australia"               |

Each page composes from the standard block library:

1. **Hero** — H1 with literal target query
2. **Eligibility** (optional) — criteria list for trust + featured-snippet eligibility
3. **FAQ** — answers to long-tail variations; auto-emits FAQPage JSON-LD
4. **CTA** — conversion to consultation / risk-check / contact

All editable from `/admin/pages/{id}/edit` like any other page.

### Adding a new programmatic SEO page

1. **Pick the query** the admin team wants to rank for
2. **`slugFromQuery("…")`** turns it into a URL slug
3. **Create the Page** at `/admin/pages/new` with template `seo-landing`
4. **Compose sections** — Hero (H1 = query), optional Eligibility, FAQ, CTA
5. **Fill SEO panel** — title + description + OG image
6. **Publish** — `revalidateTag` invalidates caches and the sitemap picks up
   the row on its next render

## SEO scoring

`scoreSeo({...})` returns:

```ts
{ score: 87, issues: [
    { level: "warning", field: "metaDescription", message: "Description is short (62 chars; …)" },
    { level: "info", message: "Adding a FAQ block lets you claim FAQ rich results" },
]}
```

Designed to plug into the page editor's SEO panel — show the live score and
list issues so authors know what to fix before publishing. Rules:

| Check | Penalty |
| ----- | ------- |
| Missing title | −25 (error) |
| Title <20 chars | −8 |
| Title >65 chars | −5 |
| Missing description | −20 (error) |
| Description <70 chars | −8 |
| Description >165 chars | −5 |
| Slug <3 chars | −5 |
| Slug >75 chars | −3 |
| Slug not lowercase-hyphenated | −10 (error) |
| Missing OG image | −6 |
| Body text <300 chars | −10 |
| No H1 | −12 (error) |
| No sections | −5 |
| No FAQ block | −2 (info) |
| <2 internal links | −3 (info) |

## Auto internal linking

`autoInternalLink(html, rules)` walks plain text/HTML and links the first
mention of each keyword to its mapped URL, skipping anything inside `<a>`,
`<code>`, `<pre>`, `<script>`, `<style>` tags. `DEFAULT_LINK_RULES` ships
with the consultancy domain vocabulary (`student visa` →
`/services/visa`, `IELTS` → `/services/test-prep`, etc.); extend per page
with country and pathway entities pulled from the DB.

Use it inside the RichText block when rendering CMS-authored prose so
in-paragraph cross-linking emerges without the admin manually inserting
`<a>` tags.

## AI-search optimization

The structured-data + clean URL + crawler-allow combination is the
foundation for AI surfaces (ChatGPT browsing, Claude search, Perplexity,
Google AI Overviews) to pick up content:

- **Distinct H1** per programmatic page — chat models cite the headline verbatim
- **FAQ schema** — frequently surfaced as the canonical answer
- **Breadcrumb schema** — gives AI summarizers the URL hierarchy
- **`EducationalOrganization` schema** — brand recognition in vertical-specific queries
- **`robots.txt` allows AI crawlers** — opt-in to discovery in the first place
