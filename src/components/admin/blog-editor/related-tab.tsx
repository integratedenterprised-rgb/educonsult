"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/molecules/card";
import type { OtherPostRef, PostEditorValues } from "./types";

interface Props {
  otherPosts: OtherPostRef[];
}

export function RelatedTab({ otherPosts }: Props) {
  const { watch, setValue } = useFormContext<PostEditorValues>();
  const selected = (watch("relatedPostIds") ?? []) as string[];

  function toggle(id: string) {
    setValue(
      "relatedPostIds",
      selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id],
      { shouldDirty: true },
    );
  }

  function move(id: string, dir: -1 | 1) {
    const i = selected.indexOf(id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= selected.length) return;
    const next = selected.slice();
    [next[i], next[j]] = [next[j]!, next[i]!];
    setValue("relatedPostIds", next, { shouldDirty: true });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Related posts</CardTitle>
        <CardDescription>
          Manual pins override the auto-derived list (which uses shared categories, tags, and author).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selected.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pinned ({selected.length})
            </p>
            <ul className="space-y-1">
              {selected.map((id, i) => {
                const post = otherPosts.find((p) => p.id === id);
                return (
                  <li key={id} className="flex items-center justify-between rounded-md border border-border bg-background p-2 text-sm">
                    <span>{post?.title ?? "(removed post)"}</span>
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => move(id, -1)}
                        disabled={i === 0}
                        className="rounded px-2 py-1 text-xs hover:bg-muted disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(id, 1)}
                        disabled={i === selected.length - 1}
                        className="rounded px-2 py-1 text-xs hover:bg-muted disabled:opacity-40"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => toggle(id)}
                        className="rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                      >
                        Remove
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Other posts
          </p>
          <ul className="max-h-96 space-y-1 overflow-y-auto">
            {otherPosts
              .filter((p) => !selected.includes(p.id))
              .map((post) => (
                <li
                  key={post.id}
                  className="flex items-center justify-between rounded-md border border-transparent p-2 text-sm hover:border-border hover:bg-muted/30"
                >
                  <span>
                    {post.title}{" "}
                    <span className="text-xs text-muted-foreground">· {post.status}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(post.id)}
                    className="rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
                  >
                    Pin
                  </button>
                </li>
              ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
