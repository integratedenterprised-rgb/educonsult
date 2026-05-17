import { requirePermission } from "@/server/auth/session";
import { CountryForm } from "@/components/admin/countries/country-form";

export const dynamic = "force-dynamic";

export default async function NewCountry() {
  await requirePermission("countries.write");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">New country</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create a destination page entry.</p>
      </div>
      <CountryForm mode="create" />
    </div>
  );
}
