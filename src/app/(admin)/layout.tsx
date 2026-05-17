import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { permissionsFor } from "@/server/auth/permissions";
import { Sidebar } from "@/components/admin/shell/sidebar";
import { Topbar } from "@/components/admin/shell/topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?from=/admin");
  if (session.role === "VIEWER") redirect("/");

  const perms = permissionsFor(session.role).map(String);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar permissions={perms} user={session} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
