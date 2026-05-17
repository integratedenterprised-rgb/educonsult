/**
 * Auto internal linking.
 *
 * Given a body of text and a dictionary of (keyword → URL) mappings, returns
 * the text with the first occurrence of each keyword wrapped in a link.
 *
 * Use this to densify cross-linking on CMS-driven body copy without manual
 * `<a>` tagging. Operates on plain text or trusted HTML — see safety notes.
 *
 * Safety:
 *   - The input is expected to be CMS-authored (admin-controlled) HTML or
 *     plain text. This helper does not sanitize HTML; pair with DOMPurify or
 *     similar at render time if untrusted input could ever flow here.
 *   - Skips replacements inside existing `<a>`, `<code>`, `<pre>` tags.
 *   - Replaces only the first occurrence per keyword to avoid spammy linking.
 */

export interface LinkRule {
  keyword: string;
  url: string;
  /** Optional accessible label override. Defaults to the keyword. */
  title?: string;
}

const PROTECTED_TAGS = ["a", "code", "pre", "script", "style"];

export function autoInternalLink(html: string, rules: LinkRule[]): string {
  // Build segments around protected tags so we never modify content inside them.
  const segments = splitByProtectedTags(html);
  const seen = new Set<string>();

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg || seg.kind === "protected") continue;
    segments[i] = { ...seg, value: applyRulesOnce(seg.value, rules, seen) };
  }

  return segments.map((s) => s?.value ?? "").join("");
}

interface Segment {
  kind: "open" | "protected";
  value: string;
}

function splitByProtectedTags(html: string): Segment[] {
  const tagPattern = new RegExp(
    `<(${PROTECTED_TAGS.join("|")})\\b[^>]*>[\\s\\S]*?</\\1>`,
    "gi",
  );
  const out: Segment[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(html)) !== null) {
    if (match.index > lastIdx) {
      out.push({ kind: "open", value: html.slice(lastIdx, match.index) });
    }
    out.push({ kind: "protected", value: match[0] });
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < html.length) out.push({ kind: "open", value: html.slice(lastIdx) });
  return out;
}

function applyRulesOnce(text: string, rules: LinkRule[], seen: Set<string>): string {
  let result = text;
  for (const rule of rules) {
    if (seen.has(rule.keyword.toLowerCase())) continue;
    const pattern = new RegExp(`\\b(${escapeRegex(rule.keyword)})\\b`, "i");
    const replaced = result.replace(pattern, (match) => {
      seen.add(rule.keyword.toLowerCase());
      const title = rule.title ?? match;
      return `<a href="${rule.url}" title="${escapeAttr(title)}">${match}</a>`;
    });
    if (replaced !== result) result = replaced;
  }
  return result;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;");
}

/**
 * Default link rules for the consultancy domain. Extend at the call site
 * with page-specific entities (country names, course pathways from DB).
 */
export const DEFAULT_LINK_RULES: LinkRule[] = [
  { keyword: "student visa", url: "/services/visa" },
  { keyword: "eligibility check", url: "/eligibility" },
  { keyword: "course pathways", url: "/pathways" },
  { keyword: "IELTS", url: "/services/test-prep" },
  { keyword: "TOEFL", url: "/services/test-prep" },
  { keyword: "SOP", url: "/resources/sop-template-stem" },
];
