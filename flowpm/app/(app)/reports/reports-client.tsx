"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { firestoreToDate } from "@/lib/firebase/firestore-dates";
import { PageMotion } from "@/components/flowpm/page-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

type ProjectHours = { projectId: string; name: string; hours: number };
type ProjectCompletion = { projectId: string; name: string; done: number; total: number; percent: number };
type MemberLoad = { memberId: string; name: string; openTasks: number };

type TaskStatusKey = "todo" | "in_progress" | "review" | "done";

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-2 text-xs">
        <span className="min-w-0 truncate font-medium text-flowpm-body">{label}</span>
        <span className="shrink-0 tabular-nums text-flowpm-muted">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-flowpm-canvas">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function HoursBarPair({
  label,
  total,
  billable,
  max,
}: {
  label: string;
  total: number;
  billable: number;
  max: number;
}) {
  const pctTotal = max > 0 ? Math.min(100, Math.round((total / max) * 100)) : 0;
  const pctBill = max > 0 ? Math.min(100, Math.round((billable / max) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between gap-2 text-xs">
        <span className="min-w-0 truncate font-medium text-flowpm-body">{label}</span>
        <span className="shrink-0 tabular-nums text-flowpm-muted">
          {billable % 1 === 0 ? billable : billable.toFixed(1)}h / {total % 1 === 0 ? total : total.toFixed(1)}h
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-flowpm-canvas">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-[#534ab7]/55"
          style={{ width: `${pctTotal}%` }}
        />
        <div className="absolute left-0 top-0 h-full rounded-full bg-[#0f6e56]" style={{ width: `${pctBill}%` }} />
      </div>
    </div>
  );
}

function formatBdt(n: number) {
  return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(n);
}

function PieLegend({
  slices,
}: {
  slices: { key: string; label: string; pct: number; color: string }[];
}) {
  const gradient = useMemo(() => {
    let acc = 0;
    const parts: string[] = [];
    for (const s of slices) {
      if (s.pct <= 0) continue;
      const start = acc;
      acc += s.pct;
      parts.push(`${s.color} ${start}% ${acc}%`);
    }
    if (parts.length === 0) return "conic-gradient(#e5e7eb 0% 100%)";
    return `conic-gradient(${parts.join(", ")})`;
  }, [slices]);

  const totalPct = slices.reduce((m, s) => m + s.pct, 0);
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div
        className="mx-auto size-40 shrink-0 rounded-full border border-flowpm-border sm:mx-0"
        style={{ background: totalPct ? gradient : "#f3f4f6" }}
        role="img"
        aria-label="Task status distribution"
      />
      <ul className="flex-1 space-y-2 text-sm">
        {slices.map((s) => (
          <li key={s.key} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-flowpm-body">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
            <span className="tabular-nums text-flowpm-muted">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReportsClient({ orgId }: { orgId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<"30d" | "all">("30d");
  const [hoursByProject, setHoursByProject] = useState<ProjectHours[]>([]);
  const [completion, setCompletion] = useState<ProjectCompletion[]>([]);
  const [workload, setWorkload] = useState<MemberLoad[]>([]);
  const [kpis, setKpis] = useState<{
    totalHours: number;
    activeProjects: number;
    completedProjects: number;
    revenueBdt: number;
    doneTasks: number;
    totalTasks: number;
    taskMix: Record<TaskStatusKey, number>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const db = getFirebaseDb();
        const cutoff = new Date();
        cutoff.setUTCDate(cutoff.getUTCDate() - 30);
        cutoff.setUTCHours(0, 0, 0, 0);

        const [projSnap, timeSnap, membersSnap, invSnap] = await Promise.all([
          getDocs(collection(db, "organizations", orgId, "projects")),
          getDocs(collection(db, "organizations", orgId, "timeEntries")),
          getDocs(collection(db, "organizations", orgId, "members")),
          getDocs(collection(db, "organizations", orgId, "invoices")),
        ]);

        const projectNames = new Map<string, string>();
        let activeProjects = 0;
        let completedProjects = 0;
        projSnap.docs.forEach((d) => {
          const x = d.data() as Record<string, unknown>;
          projectNames.set(d.id, String(x.name ?? "Untitled"));
          const st = String(x.status ?? "active");
          if (st === "active") activeProjects += 1;
          if (st === "completed") completedProjects += 1;
        });

        const hoursMap = new Map<string, number>();
        for (const d of timeSnap.docs) {
          const x = d.data() as Record<string, unknown>;
          const h = x.hours as number | undefined;
          const pid = (x.projectId as string | undefined) ?? "";
          if (typeof h !== "number" || h <= 0) continue;
          const day = firestoreToDate(x.date);
          if (range === "30d") {
            if (!day || day < cutoff) continue;
          }
          const key = pid || "_none";
          hoursMap.set(key, (hoursMap.get(key) ?? 0) + h);
        }
        const hoursRows: ProjectHours[] = [];
        for (const [pid, hours] of Array.from(hoursMap.entries())) {
          hoursRows.push({
            projectId: pid,
            name: pid === "_none" ? "No project" : projectNames.get(pid) ?? "Project",
            hours,
          });
        }
        hoursRows.sort((a, b) => b.hours - a.hours);

        const taskSnaps = await Promise.all(
          projSnap.docs.map((p) => getDocs(collection(db, "organizations", orgId, "projects", p.id, "tasks"))),
        );
        const completionRows: ProjectCompletion[] = [];
        const openByAssignee = new Map<string, number>();
        const mix: Record<TaskStatusKey, number> = {
          todo: 0,
          in_progress: 0,
          review: 0,
          done: 0,
        };
        let doneTasks = 0;
        let totalTasks = 0;

        projSnap.docs.forEach((p, i) => {
          const tasks = taskSnaps[i]?.docs ?? [];
          let done = 0;
          for (const t of tasks) {
            const st = String((t.data() as Record<string, unknown>).status ?? "todo");
            totalTasks += 1;
            if (st === "done") {
              done += 1;
              doneTasks += 1;
              mix.done += 1;
            } else {
              const aid = (t.data() as Record<string, unknown>).assigneeId as string | undefined;
              if (aid) openByAssignee.set(aid, (openByAssignee.get(aid) ?? 0) + 1);
              if (st === "in_progress") mix.in_progress += 1;
              else if (st === "review") mix.review += 1;
              else mix.todo += 1;
            }
          }
          const total = tasks.length;
          completionRows.push({
            projectId: p.id,
            name: projectNames.get(p.id) ?? "Project",
            done,
            total,
            percent: total ? Math.round((done / total) * 100) : 0,
          });
        });
        completionRows.sort((a, b) => b.total - a.total);

        const memberNames = new Map<string, string>();
        membersSnap.docs.forEach((d) => {
          const x = d.data() as Record<string, unknown>;
          const email = String(x.email ?? "");
          const name = String(x.name ?? "").trim() || email.split("@")[0] || "Member";
          memberNames.set(d.id, name);
        });
        const loadRows: MemberLoad[] = membersSnap.docs.map((d) => ({
          memberId: d.id,
          name: memberNames.get(d.id) ?? d.id,
          openTasks: openByAssignee.get(d.id) ?? 0,
        }));
        loadRows.sort((a, b) => b.openTasks - a.openTasks);

        let revenueBdt = 0;
        for (const inv of invSnap.docs) {
          const x = inv.data() as Record<string, unknown>;
          if (String(x.status ?? "") !== "paid") continue;
          if (String(x.currency ?? "USD").trim().toUpperCase() !== "BDT") continue;
          const created = firestoreToDate(x.createdAt);
          if (range === "30d" && created && created < cutoff) continue;
          const tot = typeof x.total === "number" ? x.total : 0;
          revenueBdt += tot;
        }

        const totalHours = Array.from(hoursMap.values()).reduce((a, b) => a + b, 0);

        if (!cancelled) {
          setHoursByProject(hoursRows);
          setCompletion(completionRows);
          setWorkload(loadRows);
          setKpis({
            totalHours,
            activeProjects,
            completedProjects,
            revenueBdt,
            doneTasks,
            totalTasks,
            taskMix: mix,
          });
        }
      } catch {
        if (!cancelled) setError("Could not load reporting data. Check permissions and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [orgId, range]);

  const maxHours = useMemo(() => hoursByProject.reduce((m, r) => Math.max(m, r.hours), 0), [hoursByProject]);
  const maxOpen = useMemo(() => workload.reduce((m, r) => Math.max(m, r.openTasks), 0), [workload]);

  const pieSlices = useMemo(() => {
    if (!kpis) return [];
    const { taskMix, totalTasks } = kpis;
    if (totalTasks === 0) return [];
    const entries: { key: TaskStatusKey; label: string; color: string }[] = [
      { key: "done", label: "Completed", color: "#166534" },
      { key: "todo", label: "To do", color: "#9ca3af" },
      { key: "in_progress", label: "In progress", color: "#534ab7" },
      { key: "review", label: "Review", color: "#ea580c" },
    ];
    return entries.map((e) => ({
      ...e,
      pct: totalTasks ? Math.round((taskMix[e.key] / totalTasks) * 100) : 0,
    }));
  }, [kpis]);

  const billableRate =
    kpis && kpis.totalTasks > 0 ? Math.round((kpis.doneTasks / kpis.totalTasks) * 1000) / 10 : null;

  if (loading) {
    return (
      <PageMotion>
        <p className="text-sm text-flowpm-muted">Loading reports…</p>
      </PageMotion>
    );
  }

  if (error) {
    return (
      <PageMotion>
        <p className="text-sm text-flowpm-danger">{error}</p>
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold text-flowpm-dark">Reports &amp; analytics</h2>
          <p className="mt-1 text-sm text-flowpm-muted">Track performance, hours, and revenue for this workspace.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-flowpm-border bg-flowpm-surface p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setRange("30d")}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors",
                range === "30d" ? "bg-flowpm-primary text-white" : "text-flowpm-muted hover:text-flowpm-body",
              )}
            >
              Last 30 days
            </button>
            <button
              type="button"
              onClick={() => setRange("all")}
              className={cn(
                "rounded-md px-3 py-1.5 transition-colors",
                range === "all" ? "bg-flowpm-primary text-white" : "text-flowpm-muted hover:text-flowpm-body",
              )}
            >
              All time
            </button>
          </div>
          <Button type="button" variant="outline" className="h-9 gap-2" disabled title="Connect export later">
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>

      {kpis ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-flowpm-border shadow-card">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-flowpm-muted">Paid revenue (BDT)</p>
              <p className="mt-1 font-heading text-2xl font-semibold text-[#0f6e56]">{formatBdt(kpis.revenueBdt)}</p>
              <p className="mt-1 text-xs text-flowpm-muted">From paid invoices in this range.</p>
            </CardContent>
          </Card>
          <Card className="border-flowpm-border shadow-card">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-flowpm-muted">Logged hours</p>
              <p className="mt-1 font-heading text-2xl font-semibold text-flowpm-dark">
                {kpis.totalHours % 1 === 0 ? kpis.totalHours : kpis.totalHours.toFixed(1)}h
              </p>
              <p className="mt-1 text-xs text-flowpm-muted">Time entries {range === "30d" ? "in the last 30 days" : "all time"}.</p>
            </CardContent>
          </Card>
          <Card className="border-flowpm-border shadow-card">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-flowpm-muted">Tasks completed</p>
              <p className="mt-1 font-heading text-2xl font-semibold text-flowpm-primary">
                {billableRate != null ? `${billableRate}%` : "—"}
              </p>
              <p className="mt-1 text-xs text-flowpm-muted">
                {kpis.doneTasks} of {kpis.totalTasks} tasks marked done (all projects).
              </p>
            </CardContent>
          </Card>
          <Card className="border-flowpm-border shadow-card">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-flowpm-muted">Active projects</p>
              <p className="mt-1 font-heading text-2xl font-semibold text-flowpm-dark">{kpis.activeProjects}</p>
              <p className="mt-1 text-xs text-flowpm-muted">
                {kpis.completedProjects} project{kpis.completedProjects === 1 ? "" : "s"} marked completed.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-flowpm-border shadow-card">
          <CardHeader>
            <CardTitle className="font-heading text-base">Hours by project</CardTitle>
            <p className="text-xs text-flowpm-muted">
              Purple = total logged hours; green matches total (billable tagging can be added later).
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {hoursByProject.length === 0 ? (
              <p className="text-sm text-flowpm-muted">No time entries in this range.</p>
            ) : (
              hoursByProject.map((r) => (
                <HoursBarPair
                  key={r.projectId || "none"}
                  label={r.name}
                  total={r.hours}
                  billable={r.hours}
                  max={maxHours}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-flowpm-border shadow-card">
          <CardHeader>
            <CardTitle className="font-heading text-base">Task status distribution</CardTitle>
            <p className="text-xs text-flowpm-muted">All tasks across projects (not date-filtered).</p>
          </CardHeader>
          <CardContent>
            {pieSlices.length === 0 || (kpis?.totalTasks ?? 0) === 0 ? (
              <p className="text-sm text-flowpm-muted">No tasks yet.</p>
            ) : (
              <PieLegend slices={pieSlices} />
            )}
          </CardContent>
        </Card>

        <Card className="border-flowpm-border shadow-card">
          <CardHeader>
            <CardTitle className="font-heading text-base">Task completion by project</CardTitle>
            <p className="text-xs text-flowpm-muted">Done vs total tasks</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {completion.length === 0 ? (
              <p className="text-sm text-flowpm-muted">No projects.</p>
            ) : (
              completion.map((r) => (
                <BarRow
                  key={r.projectId}
                  label={r.name}
                  value={r.percent}
                  max={100}
                  color="#0f6e56"
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-flowpm-border shadow-card">
          <CardHeader>
            <CardTitle className="font-heading text-base">Team workload</CardTitle>
            <p className="text-xs text-flowpm-muted">Open (non-done) tasks assigned to each member</p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {workload.every((w) => w.openTasks === 0) ? (
              <p className="text-sm text-flowpm-muted sm:col-span-2">No assigned open tasks right now.</p>
            ) : (
              workload.map((w) => (
                <BarRow
                  key={w.memberId}
                  label={w.name}
                  value={w.openTasks}
                  max={maxOpen || 1}
                  color="#7f77dd"
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PageMotion>
  );
}
