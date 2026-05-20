import { getSiteSettings } from "@/server/cms/settings.service";
import { ok } from "@/server/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSiteSettings();
  return ok(settings);
}
