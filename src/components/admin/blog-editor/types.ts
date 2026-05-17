import type { BlogPostUpdateInput } from "@/lib/validators/blog";

/**
 * The editor form state matches the API input directly. Keeping them in
 * lockstep means we can hand the values straight to `fetch(.../api/...)`
 * after `zodResolver(blogPostUpdateSchema)` has validated them.
 */
export type PostEditorValues = BlogPostUpdateInput;

export interface OptionRef {
  id: string;
  slug: string;
  name: string;
}

export interface OtherPostRef {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
}
