import type { JsonLd } from "@/lib/seo";

/**
 * `<JsonLd />` — emits a `<script type="application/ld+json">` tag.
 *
 * Server-rendered. Accepts a single schema or an array. Strips `undefined`
 * values so the output isn't full of `"foo": null` noise that some validators
 * complain about.
 *
 * Use multiple instances per page (e.g. one for WebPage, one for Breadcrumb,
 * one for FAQPage) — search engines parse each independently.
 */
export function JsonLd({ data }: { data: JsonLd | JsonLd[] }) {
  const payload = Array.isArray(data) ? data.map(prune) : prune(data);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialize(payload) }}
    />
  );
}

/**
 * JSON-in-script serialization. We escape five characters:
 *   `<` `>`     — prevent `</script>` from prematurely closing the tag
 *                 and `<!--` from starting an HTML comment
 *   `&`         — defensive against rare XHTML parsers that entity-decode
 *   U+2028/2029 — line/paragraph separators that some JS parsers treat as
 *                 newlines (would break `eval`-style parses; harmless for
 *                 JSON.parse, but Google's structured-data parser is lenient
 *                 and this keeps the output portable)
 */
const ESCAPE_CHARS: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  " ": "\\u2028",
  " ": "\\u2029",
};

function serialize(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (c) => ESCAPE_CHARS[c]!);
}

function prune<T>(value: T): T {
  if (Array.isArray(value)) return value.map(prune) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined || v === null) continue;
      if (Array.isArray(v) && v.length === 0) continue;
      out[k] = prune(v);
    }
    return out as T;
  }
  return value;
}
