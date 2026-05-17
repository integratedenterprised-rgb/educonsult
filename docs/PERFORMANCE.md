# Performance Strategy

This document captures how the educational-consultancy site is tuned for
production. It is the source of truth that engineers should read before
introducing new pages, blocks, or third-party scripts.

Target budget for every public route:

| Metric                       | Target  |
| ---------------------------- | ------- |
| Lighthouse Performance       | ≥ 95    |
| Lighthouse SEO               | ≥ 95    |
| Lighthouse Best Practices    | ≥ 95    |
| LCP (mobile, 4G)             | ≤ 2.0s  |
| INP                          | ≤ 200ms |
| CLS                          | ≤ 0.05  |
| TTFB (warm cache)            | ≤ 200ms |
| Total JS (gzip, first load)  | ≤ 170kb |
| Total CSS (gzip)             | ≤ 30kb  |
| LCP image transfer size      | ≤ 200kb |

## 1. Rendering model

| Surface              | Mode                | Revalidation                            |
| -------------------- | ------------------- | --------------------------------------- |
| `/` (home)           | ISR                 | `revalidate = 300` + on-demand tag      |
| `/[...slug]`         | ISR + SSG seed      | `revalidate = 300` + per-slug cache tag |
| `/blog`              | ISR                 | `revalidate = 60`                       |
| `/blog/[slug]`       | ISR                 | `revalidate = 60`                       |
| `/blog/category/*`   | ISR                 | `revalidate = 60`                       |
| `/admin/*`           | SSR, never cached   | `no-store` via `next.config` headers    |
| `/api/*`             | SSR, never cached   | `no-store` unless route opts in         |
| `sitemap.xml`        | ISR                 | `revalidate = 3600`                     |
| `robots.txt`         | Static              | n/a                                     |

- `generateStaticParams` pre-renders every published CMS page at build time
  so the first edge visitor never pays the cold-render cost.
- `unstable_cache` wraps every CMS read (`cms:theme`, `cms:nav`,
  `cms:settings`, `cms:page:{slug}`). Admin mutations call `revalidateTag()`
  so changes appear within ~1 RTT.
- Lead/analytics writes use `revalidatePath` only for the admin route they
  affect — they never touch public-facing tags.

## 2. Caching strategy

Three layers, each owned by a different system:

### Edge cache (CDN)

Driven by the `Cache-Control` headers in `next.config.ts`:

| Path                       | Header                                                                       |
| -------------------------- | ---------------------------------------------------------------------------- |
| `/_next/static/*`          | `public, max-age=31536000, immutable`                                        |
| `/_next/image*`            | `public, max-age=60, s-maxage=31536000, stale-while-revalidate=86400`        |
| `/favicon.ico`, `/robots.txt`, `/sitemap.xml` | `public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800` |
| `/fonts/*`                 | `public, max-age=31536000, immutable`                                        |
| `/admin/*`                 | `private, no-store`                                                          |
| `/api/*`                   | `no-store` (routes can override)                                             |

ISR HTML pages are served with Next.js's built-in `s-maxage` + `stale-while-revalidate`
generated from the route's `revalidate` value. No manual override needed.

### Data cache (Next runtime)

- `unstable_cache(fn, key, { tags, revalidate })` for every read.
- Cache tags are namespaced (`cms:`, `leads:`, `analytics:`).
- Mutations call `revalidateTag()` — never `revalidatePath()` on public pages.

### Browser cache

- All static assets fingerprinted by Next.js (`_next/static/...`) → immutable.
- API responses default to `no-store` so authenticated UIs don't leak.
- Service worker is **not** used (avoids cache-busting confusion across deploys).

## 3. Assets

### Images

- Every public `<img>` is replaced by `next/image`. Raw `<img>` is allowed
  only inside admin where Lighthouse doesn't run.
- `formats: ["image/avif", "image/webp"]` in `next.config.ts`.
- `deviceSizes` and `imageSizes` tuned for typical breakpoints (down to 360px
  for low-end Android, up to 2560 for retina laptops).
- LCP image (hero background) renders with `priority` so it joins the preload
  list and is fetched on the parser thread.
- Below-the-fold images get `loading="lazy" decoding="async"`.
- Every image declares `sizes` — without it, the browser ships the largest
  variant. This is the single highest-leverage perf rule on the site.
- `minimumCacheTTL = 30d` on the optimizer so we don't re-encode on every
  revalidation.

### Fonts

- Two families: Inter (body) and Poppins (heading), loaded through
  `next/font/google`. next/font self-hosts the binary so the critical path
  has zero third-party RTT.
- `display: swap` (no FOIT) + `adjustFontFallback: "Arial"` so the system
  fallback matches Inter/Poppins x-height — eliminates CLS on font swap.
- Heading font ships only weights 500/600/700.
- `preconnect` + `dns-prefetch` to `fonts.gstatic.com` warms the cache for
  edge cases where the bundler couldn't inline a glyph subset.

### CSS

- Tailwind v3 with content scoped to `./src/**/*.{ts,tsx}`. JIT prunes unused
  utilities; production CSS is < 30kb gzipped.
- HSL theme tokens live on `:root` so a palette swap doesn't rebuild Tailwind.
- `content-visibility: auto` (`.cv-auto` utility) on every non-LCP CMS
  section so off-screen blocks skip layout/paint cost.
- `prefers-reduced-motion` short-circuits all animations globally.

## 4. JavaScript

- `modularizeImports` rewrites `import { X } from "lucide-react"` to
  per-icon imports — kills the ~600kb full-icon-set bundle.
- `experimental.optimizePackageImports` runs the same optimization for
  `framer-motion` and every Radix package we use.
- `framer-motion` is wrapped in `<LazyMotion features={domAnimation} strict>`
  in `MotionFade`. Pages without any motion node pay zero animation bundle.
- `next/dynamic` lazy-loads every below-the-fold CMS block from
  `block-registry.tsx`. Above-the-fold (`hero`, `richText`, `cta`,
  `countryGrid`) stays eager so the LCP isn't gated on a chunk.
- `Suspense` wraps each non-LCP section in `SectionRenderer` so dynamic
  imports stream in without blocking the document.
- `compiler.removeConsole` strips `console.log` calls in production
  (keeps `error`/`warn` for monitoring).

## 5. SEO

- `buildMetadata()` centralises canonical, OG, Twitter, robots, locale, and
  format-detection. Every public page calls it.
- `metadataBase` + `alternates.canonical` set per route.
- `OpenGraph` + `Twitter` cards always include a 1200×630 image (defaults
  to `/og-default.png` if the CMS hasn't set one).
- `googleBot.max-image-preview = large` to opt into image-rich SERPs.
- `sitemap.xml` pulls pages, posts, categories, tags, authors and emits
  `priority` + `changefreq` heuristically per template.
- `robots.ts` explicitly allows GPTBot / ClaudeBot / PerplexityBot / Google-
  Extended for AI-discovery visibility.
- `JsonLd` emits Organization + WebSite once site-wide, with per-route
  WebPage / Article / BreadcrumbList / FAQPage where applicable.
- `<html lang>` derived from the active locale; `hreflang` alternates emit
  when a page provides translations.

## 6. CDN recommendations

Pick **one** of the following — all three integrate cleanly with the headers
this codebase already emits.

### Vercel (recommended)

- Native Next.js host. ISR + tag revalidation works out of the box.
- Edge Network with automatic geographic routing, no extra config.
- Image optimizer runs at the edge — no need for a separate image CDN.
- Configure `runtime = "edge"` on lightweight API routes (analytics ingest,
  geo lookup) for sub-100ms TTFB globally.
- Build cost: zero infra.

### Cloudflare (DIY)

- Deploy on Cloudflare Pages with `@cloudflare/next-on-pages`, or proxy
  Vercel through Cloudflare for additional WAF / bot rules.
- Enable Argo Smart Routing for SE-Asia → US transit.
- Set Page Rules to honour the long edge caches we already declare.
- Rocket Loader **OFF** — it conflicts with Next.js hydration.
- Polish / Mirage OFF — next/image already serves AVIF/WebP.

### AWS CloudFront + S3 / Lambda@Edge

- Use only if compliance forces AWS. Otherwise the other two are simpler.
- Origin = Lambda (SSR), S3 (static), CloudFront sits in front.
- Mirror the `Cache-Control` headers; CloudFront respects `s-maxage`.
- Add a Lambda@Edge for `revalidateTag` webhook → cache-tag-based
  invalidation (CloudFront doesn't natively support tag invalidation).

### Cross-CDN baseline

Regardless of CDN, enforce:

- Brotli compression at the edge (gzip fallback).
- HTTP/3 / QUIC enabled for mobile networks.
- TLS 1.3.
- 0-RTT resumption for returning visitors.
- Origin in `ap-south` (closest to Nepal-based DB).
- Image origin shielded — `next/image` requests must hit the optimizer only
  once per (src, width, format) tuple.

## 7. Monitoring

- Next.js Speed Insights (Vercel) for field RUM (LCP, INP, CLS).
- First-party analytics (`/api/analytics/events`) captures `PAGE_VIEW`,
  `LEAD_CREATED`, etc. Cross-reference with Web Vitals.
- Lighthouse CI runs on every PR (workflow not yet provisioned — TODO).
- Bundle-analyzer report: `ANALYZE=true pnpm build` once `@next/bundle-analyzer`
  is wired (TODO).

## 8. Things we deliberately don't do

- **Service worker / offline cache.** Adds an axis of cache-bust bugs that
  outweighs the win for a content site that already serves static HTML from
  the edge.
- **Third-party heatmap tags loaded unconditionally.** Heatmap providers
  are admin-toggleable and injected only when configured.
- **`next/script` `beforeInteractive` outside the layout.** Forces
  blocking script loads — anti-pattern for non-critical analytics.
- **Run-time CSS-in-JS.** Tailwind compiles at build time; no runtime cost.
- **Aggressive prefetching.** Next.js's default link prefetch on hover is
  enough; aggressive prefetch wastes mobile data plans.
