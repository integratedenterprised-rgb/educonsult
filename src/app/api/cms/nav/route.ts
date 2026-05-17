import { getHeaderNav, getFooterColumns } from "@/server/cms/nav.service";
import { ok } from "@/server/api/response";

export async function GET() {
  const [header, footer] = await Promise.all([getHeaderNav(), getFooterColumns()]);
  return ok({ header, footer });
}
