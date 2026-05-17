# Educational Consultancy — Platform

Production-grade Next.js 15 platform. **Every visible element is CMS-driven**; nothing is
hardcoded in the JSX. The admin panel controls site name, logo, navigation, footer, page
content, and the active color theme.

## Stack

- **Next.js 15** App Router · React Server Components by default
- **TypeScript** strict
- **Tailwind CSS** with HSL CSS-variable theming (admin-swappable, no rebuild)
- **ShadCN UI** primitives (`components/ui/`)
- **Framer Motion** for animation (installed; opt-in per component)
- **Prisma 5** + **PostgreSQL**
- **Zustand** for ephemeral client state only
- **React Hook Form** + **Zod** for forms and runtime validation

## Quick start

```bash
cp .env.example .env
npm install --legacy-peer-deps
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

> **Note:** `package.json` declares `pnpm@9.12.0` but the committed lockfile
> is npm's (`package-lock.json`). The React 19 RC peer-dep tree currently
> requires `--legacy-peer-deps`. Run tests with `npm test`.

Then visit:
- `http://localhost:3000/` — public site (homepage from CMS)
- `http://localhost:3000/admin` — admin dashboard
- `http://localhost:3000/admin/settings/theme` — theme picker

## Architecture

```
src/
├── app/
│   ├── (site)/                    Public route group  (Navbar + Footer)
│   │   ├── layout.tsx
│   │   ├── page.tsx               Homepage (CMS-driven)
│   │   └── [...slug]/page.tsx     Catch-all CMS page renderer
│   ├── (admin)/                   Admin route group
│   │   └── admin/
│   │       ├── page.tsx           Dashboard
│   │       ├── pages/             Page management
│   │       ├── nav/               Navigation editor
│   │       ├── footer/            Footer editor
│   │       └── settings/theme/    Theme picker
│   ├── api/
│   │   ├── cms/
│   │   │   ├── theme/             GET active + presets · POST /activate
│   │   │   ├── nav/               GET header + footer menus
│   │   │   ├── settings/          GET site settings
│   │   │   └── page/              GET page by slug
│   │   └── health/                DB liveness probe
│   ├── layout.tsx                 Root — emits theme CSS variables
│   ├── globals.css                Fallback Tailwind tokens
│   ├── sitemap.ts                 Auto-generated from PUBLISHED pages
│   ├── robots.ts                  Excludes /admin, /api
│   ├── not-found.tsx
│   └── error.tsx
├── components/
│   ├── ui/                        ShadCN primitives
│   ├── layout/
│   │   ├── container.tsx          Responsive max-width container
│   │   ├── section-wrapper.tsx    Padding/background per section settings
│   │   ├── navbar/                Server shell + client mobile drawer
│   │   └── footer/                Server shell
│   ├── cms/
│   │   ├── section-renderer.tsx   Iterates Section[] → block components
│   │   ├── block-registry.tsx     Typed map: SectionType → ComponentType
│   │   └── blocks/                One file per block type
│   └── providers/
│       ├── theme-style.tsx        Injects admin-selected theme as CSS vars
│       ├── theme-provider.tsx     next-themes (dark/light class toggle)
│       └── providers.tsx          Composition root
├── server/
│   ├── cms/                       Server-only data services
│   │   ├── theme.service.ts       getActiveTheme · listThemes · activateTheme
│   │   ├── settings.service.ts    getSiteSettings · setSetting
│   │   ├── nav.service.ts         getHeaderNav · getFooterColumns
│   │   └── page.service.ts        getPageBySlug · getHomepage
│   ├── api/
│   │   └── response.ts            Standard {ok, data} | {ok, error} envelope
│   └── auth/
│       └── session.ts             Stub — replace with real auth provider
├── lib/
│   ├── env.ts                     Zod-validated process.env (server + client)
│   ├── config.ts                  Static config (locales, cache TTLs, routes)
│   ├── prisma.ts                  Prisma singleton
│   ├── theme.ts                   Token schema · CSS builder · fallback
│   ├── seo.ts                     buildMetadata() from CMS data
│   ├── utils.ts                   cn(), slugify(), absoluteUrl()
│   └── validators/                Shared Zod schemas
├── stores/                        Zustand — ephemeral UI state only
├── types/                         Cross-cutting TS types (cms, theme, api)
├── hooks/
├── styles/
└── middleware.ts                  Admin gate stub
```

## Dynamic CMS rendering

A page is a row in `Page` with a JSON `sections` column. Each entry is a discriminated
union member of `Section`:

```ts
type Section =
  | { type: "hero";        data: { headline; subheadline; … } }
  | { type: "cta";         data: { heading; body;  … } }
  | { type: "testimonials"; data: { items: […] } }
  | …
```

`SectionRenderer` walks the array, looks up the matching component in `blockRegistry`,
and hands it the typed `data`. **Adding a new block type is three steps**, no central
dispatcher to maintain:

1. Add a member to the `Section` union in `types/cms.ts`.
2. Drop a renderer in `components/cms/blocks/`.
3. Register it in `block-registry.tsx`.

The mapped-type registry forces exhaustiveness at compile time — forgetting step 3
fails the TypeScript build.

## Admin-selectable theme

The active palette lives in the `SiteTheme` table as a JSON map of HSL strings
(`"222 47% 11%"`). On every request, `<ThemeStyle />` in the root layout reads the
active row and emits a `:root { --primary: …; --foreground: …; … }` block in `<head>`.

Tailwind's `tailwind.config.ts` already references those variables via
`hsl(var(--primary))`, so swapping themes:

- Requires **no rebuild**
- Applies before first paint (server-rendered)
- Survives full-page reloads and hydration without flash

The admin picker (`/admin/settings/theme`) calls `POST /api/cms/theme/activate`, which
flips `isActive` in a transaction and revalidates the `cms:theme` cache tag. The next
request renders with the new palette.

## Type-safe configuration system

| Layer | File | Purpose | Read where |
| --- | --- | --- | --- |
| **Env** | `lib/env.ts` | Zod-validated `process.env` — crashes boot on invalid input | Anywhere (server-only fields gated by `typeof window`) |
| **Static config** | `lib/config.ts` | Locales, cache TTLs, feature flags, route names | Anywhere |
| **Dynamic config** | `server/cms/settings.service.ts` | Site name, contact, social — from `SiteSetting` table | Server only, request-scoped, cached |
| **Active theme** | `server/cms/theme.service.ts` | HSL palette + typography from `SiteTheme` | Server only, request-scoped, cached |

## SEO

- `generateMetadata` on every public route pulls page-level SEO from the CMS row and
  falls back to site-wide settings.
- `buildMetadata()` produces canonical, OpenGraph, and Twitter card metadata in one
  call.
- `sitemap.ts` enumerates published pages.
- `robots.ts` excludes `/admin` and `/api`.

## Caching strategy

CMS reads use `unstable_cache` keyed by tag:

| Tag | Revalidated when |
| --- | --- |
| `cms:theme` | Admin activates or edits a theme |
| `cms:nav` | Nav/footer items mutated |
| `cms:settings` | Site setting updated |
| `cms:page:{slug}` | Page saved |

TTLs in `lib/config.ts → cache`. Tag-based invalidation means admin saves go live in
milliseconds without waiting for TTL expiry.

## What's next

- Wire a real auth provider into `server/auth/session.ts` and `middleware.ts`
- Build the page-block editor (drag-drop sections, RHF + Zod per block)
- Promote the `Page.sections` JSON column to a relational `Section` table once
  shapes stabilize
- Add the `Country`, `Testimonial`, `BlogPost`, `Resource`, `LeadForm` content models
- Add i18n routing once Locale enum has more members
