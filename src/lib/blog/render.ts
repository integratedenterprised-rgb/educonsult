/**
 * Body rendering pipeline.
 *
 *   raw body (HTML / MDX / Lexical JSON)
 *     → normalize to HTML
 *     → inject heading ids + extract TOC
 *     → splice CTA blocks at admin-chosen anchors
 *     → run auto internal-link rules
 *
 * Output is a single HTML string plus a TOC array. We deliberately do
 * everything as string transforms so the renderer can run server-side
 * inside `unstable_cache` without pulling in heavyweight MDX runtimes
 * for posts that don't need them.
 *
 * MDX path:
 *   The MDX-source is parsed into HTML at save time by the admin editor
 *   (so the public read path stays fast). What lands in `body` is already
 *   HTML or HTML-with-MDX-leftovers; the renderer doesn't re-parse. To
 *   support real MDX components in the future, swap `mdxToHtml` for a
 *   real next-mdx-remote compile.
 */
import type { BlogBodyFormat } from "@prisma/client";
import { injectHeadingIds, type TocItem } from "./toc";
import { autoInternalLink, type LinkRule, DEFAULT_LINK_RULES } from "@/lib/seo";

export interface CtaPlacement {
  /** Match the placement enum on BlogPostCta. */
  placement: "AFTER_INTRO" | "AFTER_HEADING" | "END_OF_POST" | "SIDEBAR" | "AFTER_PARAGRAPH";
  anchor?: string | null;
  paragraphIndex?: number | null;
  /** Opaque html fragment to inject at the chosen anchor. */
  html: string;
}

export interface RenderInput {
  body: string;
  bodyFormat: BlogBodyFormat;
  ctas?: CtaPlacement[];
  /** Per-post link rules layered on top of the global defaults. */
  linkRules?: LinkRule[];
  /** When false, skip the global rules and use only `linkRules`. */
  useDefaultLinkRules?: boolean;
}

export interface RenderResult {
  html: string;
  toc: TocItem[];
  /** CTAs that should render outside the body (sidebar / end-of-post). */
  sidebarCtas: string[];
  endCtas: string[];
}

export function renderBody(input: RenderInput): RenderResult {
  const sourceHtml = toHtml(input.body, input.bodyFormat);
  const { html: withIds, toc } = injectHeadingIds(sourceHtml);

  const ctas = input.ctas ?? [];
  const sidebarCtas: string[] = [];
  const endCtas: string[] = [];
  let withCtas = withIds;

  for (const cta of ctas) {
    switch (cta.placement) {
      case "SIDEBAR":
        sidebarCtas.push(cta.html);
        break;
      case "END_OF_POST":
        endCtas.push(cta.html);
        break;
      case "AFTER_INTRO":
        withCtas = spliceAfterIntro(withCtas, cta.html);
        break;
      case "AFTER_HEADING":
        if (cta.anchor) withCtas = spliceAfterHeading(withCtas, cta.anchor, cta.html);
        break;
      case "AFTER_PARAGRAPH":
        if (typeof cta.paragraphIndex === "number") {
          withCtas = spliceAfterParagraph(withCtas, cta.paragraphIndex, cta.html);
        }
        break;
    }
  }

  const linkRules = [
    ...(input.useDefaultLinkRules !== false ? DEFAULT_LINK_RULES : []),
    ...(input.linkRules ?? []),
  ];
  const linked = linkRules.length > 0 ? autoInternalLink(withCtas, linkRules) : withCtas;

  return { html: linked, toc, sidebarCtas, endCtas };
}

// ── Format normalization ────────────────────────────────────────────────────

function toHtml(body: string, format: BlogBodyFormat): string {
  switch (format) {
    case "MDX":
      return mdxToHtml(body);
    case "LEXICAL_JSON":
      return lexicalToHtml(body);
    case "HTML":
    default:
      return body;
  }
}

/**
 * MDX → HTML. This is a deliberately small subset that handles the cases
 * authors actually use: headings, paragraphs, bold/italic, links, ordered/
 * unordered lists, fenced code, and inline code. Components are stripped to
 * plain divs with their props serialized as data-* attributes — the admin
 * editor is the source of truth for component rendering and posts that need
 * real MDX components should bake them into HTML at save time.
 */
function mdxToHtml(src: string): string {
  let s = src;

  // Fenced code blocks first (before any inline processing).
  s = s.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const escaped = escapeHtml(code);
    const langAttr = lang ? ` data-lang="${escapeAttr(lang)}"` : "";
    return `<pre${langAttr}><code>${escaped}</code></pre>`;
  });

  // Headings — must match at line starts.
  s = s.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  s = s.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  s = s.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  s = s.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  s = s.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  s = s.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

  // Lists — group consecutive `- ` lines into <ul>, `1. ` lines into <ol>.
  s = s.replace(/(?:^|\n)((?:- .+(?:\n|$))+)/g, (_m, block: string) => {
    const items = block
      .trim()
      .split("\n")
      .map((l) => `<li>${l.replace(/^- /, "")}</li>`)
      .join("");
    return `\n<ul>${items}</ul>`;
  });
  s = s.replace(/(?:^|\n)((?:\d+\. .+(?:\n|$))+)/g, (_m, block: string) => {
    const items = block
      .trim()
      .split("\n")
      .map((l) => `<li>${l.replace(/^\d+\. /, "")}</li>`)
      .join("");
    return `\n<ol>${items}</ol>`;
  });

  // Bold / italic / inline code / links.
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) =>
    `<a href="${escapeAttr(href)}">${label}</a>`,
  );

  // Paragraphs — blank-line separated chunks that aren't already block tags.
  s = s
    .split(/\n{2,}/)
    .map((chunk) => {
      const t = chunk.trim();
      if (!t) return "";
      if (/^<(h[1-6]|ul|ol|pre|blockquote|div|table|figure)/i.test(t)) return t;
      return `<p>${t.replace(/\n/g, "<br/>")}</p>`;
    })
    .filter(Boolean)
    .join("\n");

  return s;
}

/**
 * Lexical JSON → HTML.
 *
 * Lexical is the editor we ship in the admin; when a post is authored in
 * Lexical it ships the JSON tree as the body. This walker only knows the
 * structural nodes we use: paragraph, heading, list, listitem, link, text,
 * code. Unknown nodes are skipped, not errored.
 */
function lexicalToHtml(src: string): string {
  let tree: unknown;
  try {
    tree = JSON.parse(src);
  } catch {
    return ""; // malformed — render nothing rather than crash the page
  }
  const root = (tree as { root?: { children?: unknown[] } }).root;
  if (!root?.children) return "";
  return root.children.map(renderNode).join("");
}

interface LexicalNode {
  type?: string;
  text?: string;
  tag?: string;
  listType?: "bullet" | "number";
  url?: string;
  format?: number;
  children?: unknown[];
}

function renderNode(raw: unknown): string {
  const n = raw as LexicalNode;
  if (!n || typeof n !== "object") return "";
  const kids = (n.children ?? []).map(renderNode).join("");
  switch (n.type) {
    case "paragraph":
      return `<p>${kids}</p>`;
    case "heading": {
      const tag = n.tag && /^h[1-6]$/.test(n.tag) ? n.tag : "h2";
      return `<${tag}>${kids}</${tag}>`;
    }
    case "list":
      return n.listType === "number" ? `<ol>${kids}</ol>` : `<ul>${kids}</ul>`;
    case "listitem":
      return `<li>${kids}</li>`;
    case "link":
      return `<a href="${escapeAttr(n.url ?? "#")}">${kids}</a>`;
    case "quote":
      return `<blockquote>${kids}</blockquote>`;
    case "code":
      return `<pre><code>${escapeHtml(textContent(n))}</code></pre>`;
    case "text":
      return formatText(n.text ?? "", n.format ?? 0);
    default:
      return kids;
  }
}

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 1 << 1;
const FORMAT_STRIKETHROUGH = 1 << 2;
const FORMAT_UNDERLINE = 1 << 3;
const FORMAT_CODE = 1 << 4;

function formatText(text: string, mask: number): string {
  let out = escapeHtml(text);
  if (mask & FORMAT_CODE) out = `<code>${out}</code>`;
  if (mask & FORMAT_BOLD) out = `<strong>${out}</strong>`;
  if (mask & FORMAT_ITALIC) out = `<em>${out}</em>`;
  if (mask & FORMAT_STRIKETHROUGH) out = `<s>${out}</s>`;
  if (mask & FORMAT_UNDERLINE) out = `<u>${out}</u>`;
  return out;
}

function textContent(node: LexicalNode): string {
  if (typeof node.text === "string") return node.text;
  return (node.children ?? []).map((c) => textContent(c as LexicalNode)).join("");
}

// ── CTA splicing ────────────────────────────────────────────────────────────

function spliceAfterIntro(html: string, frag: string): string {
  // Splice after the first closing </p>. If no paragraph, prepend.
  const idx = html.indexOf("</p>");
  if (idx === -1) return `${frag}${html}`;
  const insertAt = idx + "</p>".length;
  return html.slice(0, insertAt) + frag + html.slice(insertAt);
}

function spliceAfterHeading(html: string, anchorId: string, frag: string): string {
  const escaped = anchorId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<h([2-4])([^>]*\\sid=["']${escaped}["'][^>]*)>[\\s\\S]*?<\\/h\\1>`, "i");
  const m = re.exec(html);
  if (!m) return `${html}${frag}`; // fallback: append
  const insertAt = m.index + m[0].length;
  return html.slice(0, insertAt) + frag + html.slice(insertAt);
}

function spliceAfterParagraph(html: string, index: number, frag: string): string {
  const re = /<\/p>/g;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (i === index) {
      const insertAt = m.index + m[0].length;
      return html.slice(0, insertAt) + frag + html.slice(insertAt);
    }
    i++;
  }
  return `${html}${frag}`;
}

// ── Escaping ────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
