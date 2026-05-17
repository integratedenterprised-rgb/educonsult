"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Label } from "@/components/ui/atoms/label";
import { Textarea } from "@/components/ui/atoms/textarea";
import { MediaPicker } from "@/components/admin/media/media-picker";
import type { SeoTargetType } from "@/server/seo/admin-seo.service";

interface Initial {
  title: string;
  description: string | null;
  keywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string;
  canonicalUrl: string;
  robots: string | null;
  twitterCardType: string | null;
  structuredData: string;
}

interface Props { targetType: SeoTargetType; targetId: string; initial: Initial }

export function SeoForm({ targetType, targetId, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  const [keywords, setKeywords] = useState(initial.keywords ?? "");
  const [ogTitle, setOgTitle] = useState(initial.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(initial.ogDescription ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(initial.ogImageUrl);
  const [canonicalUrl, setCanonicalUrl] = useState(initial.canonicalUrl);
  const [robots, setRobots] = useState(initial.robots ?? "index,follow");
  const [twitterCardType, setTwitter] = useState(initial.twitterCardType ?? "summary_large_image");
  const [structured, setStructured] = useState(initial.structuredData);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    let parsedJson: unknown = undefined;
    if (structured.trim()) {
      try { parsedJson = JSON.parse(structured); }
      catch { setSaving(false); setMsg("Structured data is not valid JSON"); return; }
    }
    const res = await fetch("/api/admin/seo", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetType, targetId, locale: "en",
        title, description, keywords, ogTitle, ogDescription,
        ogImageUrl: ogImageUrl || null,
        canonicalUrl: canonicalUrl || null,
        robots, twitterCardType, structuredData: parsedJson,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.ok) { setMsg(json.error?.message ?? "Save failed"); return; }
    setMsg("Saved.");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-border bg-card p-5">
      <Field label="Title" hint="50–60 chars is ideal">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
        <Counter value={title} ideal={[50, 60]} />
      </Field>
      <Field label="Meta description" hint="150–160 chars is ideal">
        <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
        <Counter value={description} ideal={[150, 160]} />
      </Field>
      <Field label="Keywords (comma separated)">
        <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} />
      </Field>
      <Field label="Canonical URL">
        <Input type="url" value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} placeholder="https://…" />
      </Field>
      <Field label="Robots">
        <Input value={robots} onChange={(e) => setRobots(e.target.value)} placeholder="index,follow" />
      </Field>

      <fieldset className="space-y-3 rounded-md border border-border p-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Open Graph</legend>
        <Field label="OG title"><Input value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} /></Field>
        <Field label="OG description"><Textarea rows={2} value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} /></Field>
        <Field label="OG image URL">
          <div className="flex gap-2">
            <Input value={ogImageUrl} onChange={(e) => setOgImageUrl(e.target.value)} placeholder="https://…" />
            <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
              <ImageIcon className="mr-1 h-4 w-4" /> Pick
            </Button>
          </div>
          {ogImageUrl && <img src={ogImageUrl} alt="OG preview" className="mt-2 max-h-32 rounded border border-border" />}
        </Field>
        <Field label="Twitter card type">
          <Input value={twitterCardType} onChange={(e) => setTwitter(e.target.value)} placeholder="summary_large_image" />
        </Field>
      </fieldset>

      <Field label="Structured data (JSON-LD)">
        <Textarea rows={6} value={structured} onChange={(e) => setStructured(e.target.value)}
                  placeholder='{ "@context": "https://schema.org", "@type": "WebPage" }'
                  className="font-mono text-xs" />
      </Field>

      {msg && <p className="text-sm">{msg}</p>}
      <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save SEO"}</Button>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(m) => setOgImageUrl(m.url)}
        mimeStart="image/"
      />
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Counter({ value, ideal }: { value: string; ideal: [number, number] }) {
  const len = value.length;
  const inRange = len >= ideal[0] && len <= ideal[1];
  return (
    <p className={`mt-1 text-xs ${inRange ? "text-emerald-600" : "text-muted-foreground"}`}>
      {len} chars
    </p>
  );
}
