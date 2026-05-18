"use client";

/**
 * Lightweight rich-text editor.
 *
 * A `<textarea>` plus a toolbar that wraps the selection in HTML or Markdown
 * affordances based on the current `bodyFormat`. Keeps the dependency
 * footprint tiny — for a true WYSIWYG, drop in Tiptap or Lexical in this
 * file and emit the same string value into the form.
 *
 * The editor also surfaces live word count / reading time so authors know
 * when the article passes the "thin content" threshold.
 */
import { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Link as LinkIcon,
  List,
  ListOrdered,
  Code,
  Quote,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { readingMetrics, renderBody } from "@/lib/blog";
import type { PostEditorValues } from "./types";

export function BodyEditor() {
  const { register, setValue, watch } = useFormContext<PostEditorValues>();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const body = watch("body") ?? "";
  const bodyFormat = watch("bodyFormat") ?? "HTML";

  const metrics = readingMetrics(body);

  // Hook RHF's `ref` so we can read selection for the toolbar.
  const { ref: rhfRef, ...rest } = register("body");

  function wrapSelection(opts: { html: { open: string; close: string }; md: { open: string; close: string } }) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = ta.value.slice(0, start);
    const middle = ta.value.slice(start, end);
    const after = ta.value.slice(end);
    const wrap = bodyFormat === "MDX" ? opts.md : opts.html;
    const next = `${before}${wrap.open}${middle || "text"}${wrap.close}${after}`;
    setValue("body", next, { shouldDirty: true });
    requestAnimationFrame(() => {
      ta.focus();
      const cursor = before.length + wrap.open.length;
      ta.setSelectionRange(cursor, cursor + (middle || "text").length);
    });
  }

  function insertLine(opts: { html: string; md: string }) {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const before = ta.value.slice(0, pos);
    const after = ta.value.slice(pos);
    const insert = bodyFormat === "MDX" ? opts.md : opts.html;
    const padding = before.length === 0 || before.endsWith("\n\n") ? "" : "\n\n";
    const next = `${before}${padding}${insert}\n\n${after}`;
    setValue("body", next, { shouldDirty: true });
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(before.length + padding.length, before.length + padding.length + insert.length);
    });
  }

  function insertLink() {
    const url = window.prompt("Link URL");
    if (!url) return;
    if (bodyFormat === "MDX") {
      wrapSelection({ html: { open: "", close: "" }, md: { open: "[", close: `](${url})` } });
    } else {
      wrapSelection({
        html: { open: `<a href="${url}">`, close: "</a>" },
        md: { open: "[", close: `](${url})` },
      });
    }
  }

  const preview = showPreview
    ? renderBody({ body, bodyFormat })
    : { html: "", toc: [], sidebarCtas: [], endCtas: [] };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-muted/40 p-1">
        <ToolbarBtn label="Bold" onClick={() => wrapSelection({ html: { open: "<strong>", close: "</strong>" }, md: { open: "**", close: "**" } })}>
          <Bold className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="Italic" onClick={() => wrapSelection({ html: { open: "<em>", close: "</em>" }, md: { open: "*", close: "*" } })}>
          <Italic className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="H2" onClick={() => insertLine({ html: "<h2>Section heading</h2>", md: "## Section heading" })}>
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="H3" onClick={() => insertLine({ html: "<h3>Subsection</h3>", md: "### Subsection" })}>
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="Bulleted list" onClick={() => insertLine({ html: "<ul>\n  <li>Item</li>\n</ul>", md: "- Item one\n- Item two" })}>
          <List className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="Numbered list" onClick={() => insertLine({ html: "<ol>\n  <li>Step</li>\n</ol>", md: "1. Step one\n2. Step two" })}>
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="Quote" onClick={() => insertLine({ html: "<blockquote>Quote</blockquote>", md: "> Quote" })}>
          <Quote className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="Code" onClick={() => wrapSelection({ html: { open: "<code>", close: "</code>" }, md: { open: "`", close: "`" } })}>
          <Code className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="Link" onClick={insertLink}>
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span>{metrics.wordCount} words · ~{metrics.minutes} min read</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview((v) => !v)}
            className="h-7 px-2"
          >
            {showPreview ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
            {showPreview ? "Hide preview" : "Preview"}
          </Button>
        </div>
      </div>

      {showPreview ? (
        <div className="rounded-md border border-border bg-card p-4">
          <div
            className="prose prose-neutral max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: preview.html }}
          />
        </div>
      ) : (
        <textarea
          ref={(el) => {
            rhfRef(el);
            textareaRef.current = el;
          }}
          {...rest}
          rows={24}
          className="block w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={
            bodyFormat === "MDX"
              ? "## Hello\n\nWrite Markdown here…"
              : "<h2>Hello</h2>\n<p>Write HTML here…</p>"
          }
        />
      )}
    </div>
  );
}

function ToolbarBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition hover:bg-background hover:text-foreground"
    >
      {children}
    </button>
  );
}
