import { NewPageForm } from "./new-page-form";
import { requirePermission } from "@/server/auth/session";

export default async function NewPageRoute() {
  await requirePermission("pages.write");
  return (
    <div className="max-w-xl">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">New page</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a blank draft. You&apos;ll add sections on the next screen.
      </p>
      <div className="mt-8">
        <NewPageForm />
      </div>
    </div>
  );
}
