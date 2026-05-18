import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/server/auth/session";
import { NewPostForm } from "./new-post-form";

export default async function NewPostRoute() {
  await requirePermission("blog.write");
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href="/admin/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-3 w-3" /> Back to posts
      </Link>
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">New post</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a title and slug — you&apos;ll fill in the body, SEO, and CTAs on the next screen.
        </p>
      </div>
      <NewPostForm />
    </div>
  );
}
