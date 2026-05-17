import { listThemes, getActiveTheme } from "@/server/cms/theme.service";
import { ok } from "@/server/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  const [active, presets] = await Promise.all([getActiveTheme(), listThemes()]);
  return ok({ active, presets });
}
