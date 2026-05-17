/**
 * Admin: lead detail.
 *
 * Two-column layout:
 *   Left  — contact card, source, score breakdown, tags, lead form payload
 *   Right — pipeline controls, follow-ups, notes, timeline, messages
 *
 * All mutation actions are server actions defined in `./actions.ts`. The page
 * itself remains a pure RSC.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/atoms/badge";
import { Button } from "@/components/ui/atoms/button";
import { getLead, listTags } from "@/server/leads/admin.service";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/server/auth/session";
import {
  LEAD_PRIORITY_COLORS,
  LEAD_STAGES,
  LEAD_STAGE_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_TEMP_COLORS,
} from "../_constants";
import {
  addNoteAction,
  addFollowUpAction,
  changeStatusAction,
  changeStageAction,
  assignAction,
  setTagsAction,
  completeFollowUpAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("leads.read");
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  const [counsellors, tags] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true, deletedAt: null, role: { in: ["COUNSELOR", "ADMIN", "EDITOR"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    listTags(),
  ]);

  const selectedTagIds = new Set(lead.tags.map((t) => t.tagId));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin/leads" className="text-xs text-muted-foreground hover:underline">
            ← All leads
          </Link>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {lead.fullName ?? "(no name)"}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{lead.email ?? "—"}</span>
            <span>·</span>
            <span>{lead.phone ?? "—"}</span>
            {lead.whatsapp && (
              <>
                <span>·</span>
                <span>WhatsApp: {lead.whatsapp}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${LEAD_STATUS_COLORS[lead.status]}`}>
            {lead.status}
          </span>
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${LEAD_TEMP_COLORS[lead.temperature]}`}>
            {lead.temperature} · score {lead.score}
          </span>
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${LEAD_PRIORITY_COLORS[lead.priority]}`}>
            {lead.priority}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        {/* Left column */}
        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Contact</h2>
            <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
              <Row label="Source" value={lead.source.replace(/_/g, " ").toLowerCase()} />
              <Row label="Country" value={lead.countryCode ?? "—"} />
              <Row label="Intake" value={lead.preferredIntake ?? "—"} />
              <Row label="Budget" value={lead.budgetUsd ? `$${lead.budgetUsd.toLocaleString()}` : "—"} />
              <Row label="IELTS" value={lead.ielts?.toString() ?? "—"} />
              <Row label="GPA" value={lead.gpa?.toString() ?? "—"} />
              <Row label="Created" value={new Date(lead.createdAt).toLocaleString()} />
              <Row label="Last contact" value={lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleString() : "—"} />
              <Row label="Attempts" value={lead.contactAttempts.toString()} />
            </dl>
          </section>

          {lead.visaRiskLevel && (
            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Visa risk</h2>
              <p className="mt-2 text-sm">
                Level: <b>{lead.visaRiskLevel}</b>
                {lead.visaRiskScore !== null && lead.visaRiskScore !== undefined ? ` · score ${lead.visaRiskScore}` : ""}
              </p>
            </section>
          )}

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Score breakdown</h2>
            <ul className="mt-2 space-y-1 text-xs">
              {Array.isArray(lead.scoreBreakdown) && (lead.scoreBreakdown as Array<{ key: string; delta: number; reason: string }>).map((c) => (
                <li key={c.key} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{c.reason}</span>
                  <span className={c.delta >= 0 ? "text-emerald-700" : "text-rose-700"}>
                    {c.delta >= 0 ? "+" : ""}
                    {c.delta}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Form payload</h2>
            <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(lead.data, null, 2)}
            </pre>
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Tracking</h2>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <Row label="Source URL" value={lead.sourceUrl ?? "—"} />
              <Row label="Referrer" value={lead.referrerUrl ?? "—"} />
              <Row label="UTM source" value={lead.utmSource ?? "—"} />
              <Row label="UTM medium" value={lead.utmMedium ?? "—"} />
              <Row label="UTM campaign" value={lead.utmCampaign ?? "—"} />
              <Row label="UTM term" value={lead.utmTerm ?? "—"} />
            </dl>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Pipeline */}
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Pipeline</h2>

            <form action={changeStageAction} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="leadId" value={lead.id} />
              {LEAD_STAGES.map((stage) => (
                <button
                  key={stage}
                  name="stage"
                  value={stage}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    lead.stage === stage ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/60"
                  }`}
                >
                  {LEAD_STAGE_LABELS[stage]}
                </button>
              ))}
            </form>

            <form action={changeStatusAction} className="mt-4 flex flex-wrap items-center gap-2">
              <input type="hidden" name="leadId" value={lead.id} />
              <span className="text-xs uppercase text-muted-foreground">Status</span>
              {["NEW", "CONTACTED", "QUALIFIED", "IN_PROGRESS", "WON", "LOST"].map((s) => (
                <button
                  key={s}
                  name="status"
                  value={s}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    lead.status === s ? LEAD_STATUS_COLORS[s] : "bg-muted text-foreground hover:bg-muted/60"
                  }`}
                >
                  {s}
                </button>
              ))}
              <input
                name="closeReason"
                placeholder="Close reason (WON/LOST)…"
                className="ml-2 h-8 w-48 rounded-md border border-input bg-background px-2 text-xs"
              />
            </form>
          </section>

          {/* Assignment + tags */}
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Assignment</h2>
            <form action={assignAction} className="mt-3 flex items-center gap-2">
              <input type="hidden" name="leadId" value={lead.id} />
              <select name="assignedToId" defaultValue={lead.assignedToId ?? ""} className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm">
                <option value="">Unassigned</option>
                {counsellors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
              <input name="reason" placeholder="Reason (optional)" className="h-9 w-40 rounded-md border border-input bg-background px-2 text-sm" />
              <Button type="submit" size="sm">
                Save
              </Button>
            </form>

            <h3 className="mt-4 text-sm font-semibold">Tags</h3>
            <form action={setTagsAction} className="mt-2 flex flex-wrap items-center gap-2">
              <input type="hidden" name="leadId" value={lead.id} />
              {tags.map((t) => (
                <label key={t.id} className="flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs">
                  <input type="checkbox" name="tagIds" value={t.id} defaultChecked={selectedTagIds.has(t.id)} />
                  <span>{t.label}</span>
                </label>
              ))}
              <Button type="submit" size="sm" variant="outline">
                Save tags
              </Button>
            </form>
          </section>

          {/* Follow-ups */}
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Follow-ups</h2>

            <form action={addFollowUpAction} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
              <input type="hidden" name="leadId" value={lead.id} />
              <select name="channel" className="h-9 rounded-md border border-input bg-background px-2 text-sm" required>
                {["CALL", "EMAIL", "WHATSAPP", "SMS", "MEETING", "VIDEO_CALL", "OTHER"].map((c) => (
                  <option key={c} value={c}>
                    {c.toLowerCase()}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                name="dueAt"
                required
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              />
              <input
                name="notes"
                placeholder="Notes (optional)"
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              />
              <Button type="submit" size="sm">
                Schedule
              </Button>
            </form>

            <ul className="mt-4 divide-y divide-border text-sm">
              {lead.followUps.length === 0 && <li className="py-3 text-muted-foreground">No follow-ups yet.</li>}
              {lead.followUps.map((f) => (
                <li key={f.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-xs font-medium">
                      {f.channel} · {new Date(f.dueAt).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {f.status}
                      {f.assignedTo ? ` · ${f.assignedTo.name}` : ""}
                      {f.notes ? ` · ${f.notes}` : ""}
                      {f.outcome ? ` · outcome: ${f.outcome}` : ""}
                    </div>
                  </div>
                  {f.status === "PENDING" && (
                    <form action={completeFollowUpAction}>
                      <input type="hidden" name="followUpId" value={f.id} />
                      <input
                        name="outcome"
                        placeholder="Outcome"
                        className="h-7 w-32 rounded-md border border-input bg-background px-2 text-xs"
                      />
                      <Button type="submit" size="sm" variant="outline" className="ml-2">
                        Done
                      </Button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Notes */}
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Notes</h2>
            <form action={addNoteAction} className="mt-3 space-y-2">
              <input type="hidden" name="leadId" value={lead.id} />
              <textarea
                name="body"
                required
                rows={3}
                placeholder="Write a note…"
                className="w-full rounded-md border border-input bg-background p-2 text-sm"
              />
              <div className="flex items-center justify-between">
                <label className="text-xs">
                  <input type="checkbox" name="isPinned" value="true" className="mr-1" />
                  Pin to top
                </label>
                <Button type="submit" size="sm">
                  Add note
                </Button>
              </div>
            </form>

            <ul className="mt-4 space-y-3">
              {lead.notes.length === 0 && <li className="text-sm text-muted-foreground">No notes yet.</li>}
              {lead.notes.map((n) => (
                <li key={n.id} className="rounded-md bg-muted/40 p-3 text-sm">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {n.author?.name ?? "Unknown"} · {new Date(n.createdAt).toLocaleString()}
                    </span>
                    {n.isPinned && <Badge variant="secondary">pinned</Badge>}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{n.body}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Timeline */}
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Activity</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {lead.activities.map((a) => (
                <li key={a.id} className="flex items-start gap-3 text-xs">
                  <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <div className="font-medium text-foreground">{a.summary ?? a.type}</div>
                    <div className="text-muted-foreground">
                      {a.actor?.name ?? "system"} · {new Date(a.createdAt).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Messages */}
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Messages</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {lead.messages.length === 0 && <li className="text-muted-foreground">No messages yet.</li>}
              {lead.messages.map((m) => (
                <li key={m.id} className="rounded-md border border-border p-3">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {m.channel} · {m.direction} · {m.status}
                    </span>
                    <span>{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  {m.subject && <div className="mt-1 text-xs font-medium">{m.subject}</div>}
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs">{m.body}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 break-words font-medium">{value}</dd>
    </>
  );
}
