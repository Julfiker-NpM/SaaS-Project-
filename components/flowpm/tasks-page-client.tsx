"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { firestoreToDate } from "@/lib/firebase/firestore-dates";
import { PageMotion } from "@/components/flowpm/page-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { canMutateWorkspaceContent } from "@/lib/flowpm/access";
import { Check, Circle, MoreHorizontal } from "lucide-react";

const STATUS_ORDER = ["todo", "in_progress", "review", "done"] as const;
type TaskStatus = (typeof STATUS_ORDER)[number];

const STATUS_FILTER: { id: "all" | TaskStatus; label: string }[] = [
  { id: "all", label: "All tasks" },
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  review: "Review",
  done: "Done",
};

function normalizeStatus(s: string): TaskStatus {
  return STATUS_ORDER.includes(s as TaskStatus) ? (s as TaskStatus) : "todo";
}

function initialsFromName(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0] ?? ""}${p[p.length - 1]?.[0] ?? ""}`.toUpperCase();
}

function formatDue(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(d);
}

type TaskRow = {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: TaskStatus;
  priority: string;
  dueDate: Date | null;
  assigneeId: string | null;
};

type MemberOption = { id: string; name: string };

export function TasksPageClient(props: { orgId: string; memberRole: string | null }) {
  const { orgId, memberRole } = props;
  const router = useRouter();
  const db = getFirebaseDb();
  const canEdit = canMutateWorkspaceContent(memberRole);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projSnap, memSnap] = await Promise.all([
        getDocs(collection(db, "organizations", orgId, "projects")),
        getDocs(collection(db, "organizations", orgId, "members")),
      ]);
      const memberList: MemberOption[] = memSnap.docs.map((d) => {
        const x = d.data() as Record<string, unknown>;
        const email = String(x.email ?? "");
        const name = String(x.name ?? "").trim() || email.split("@")[0] || "Member";
        return { id: d.id, name };
      });
      setMembers(memberList);

      const rows: TaskRow[] = [];
      for (const p of projSnap.docs) {
        const pd = p.data() as Record<string, unknown>;
        const projectName = String(pd.name ?? "Untitled");
        const tasksSnap = await getDocs(collection(db, "organizations", orgId, "projects", p.id, "tasks"));
        for (const t of tasksSnap.docs) {
          const td = t.data() as Record<string, unknown>;
          rows.push({
            id: t.id,
            projectId: p.id,
            projectName,
            title: String(td.title ?? "").trim() || "Untitled task",
            status: normalizeStatus(String(td.status ?? "todo")),
            priority: String(td.priority ?? "medium"),
            dueDate: firestoreToDate(td.dueDate),
            assigneeId: (td.assigneeId as string | null) ?? null,
          });
        }
      }
      rows.sort((a, b) => {
        if (a.projectName !== b.projectName) return a.projectName.localeCompare(b.projectName);
        return a.title.localeCompare(b.title);
      });
      setTasks(rows);
    } catch {
      setError("Could not load tasks.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [db, orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const memberName = useMemo(() => {
    const m = new Map<string, string>();
    members.forEach((x) => m.set(x.id, x.name));
    return m;
  }, [members]);

  const counts = useMemo(() => {
    const c: Record<TaskStatus, number> = {
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };
    for (const t of tasks) c[t.status] += 1;
    return c;
  }, [tasks]);

  const filtered = useMemo(() => {
    if (filter === "all") return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  async function toggleDone(row: TaskRow) {
    if (!canEdit) return;
    const next: TaskStatus = row.status === "done" ? "todo" : "done";
    setBusyId(row.id);
    try {
      await updateDoc(doc(db, "organizations", orgId, "projects", row.projectId, "tasks", row.id), {
        status: next,
      });
      setTasks((prev) => prev.map((t) => (t.id === row.id && t.projectId === row.projectId ? { ...t, status: next } : t)));
    } catch {
      setError("Could not update task.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <PageMotion>
        <p className="text-sm text-flowpm-muted">Loading tasks…</p>
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold text-flowpm-dark">Tasks</h2>
          <p className="mt-1 text-sm text-flowpm-muted">All tasks across projects in this workspace.</p>
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-flowpm-danger">{error}</p> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTER.map((pill) => {
          const count =
            pill.id === "all" ? tasks.length : counts[pill.id as TaskStatus];
          const active = filter === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => setFilter(pill.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-flowpm-primary bg-flowpm-primary-light text-flowpm-primary"
                  : "border-flowpm-border bg-flowpm-surface text-flowpm-muted hover:text-flowpm-body",
              )}
            >
              <span className="capitalize">{pill.label}</span>
              <span className="tabular-nums text-xs opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      <Card className="border-flowpm-border shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-flowpm-border text-xs font-medium uppercase tracking-wide text-flowpm-muted">
                  <th className="w-10 px-3 py-3" aria-label="Done" />
                  <th className="px-3 py-3">Task</th>
                  <th className="px-3 py-3">Project</th>
                  <th className="px-3 py-3">Assignee</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Priority</th>
                  <th className="px-3 py-3">Due date</th>
                  <th className="w-10 px-2 py-3" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-flowpm-muted">
                      No tasks in this view.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => {
                    const assignee = row.assigneeId ? memberName.get(row.assigneeId) ?? "—" : "—";
                    const pri = row.priority.toLowerCase();
                    return (
                      <tr key={`${row.projectId}-${row.id}`} className="border-b border-flowpm-border/80 last:border-0">
                        <td className="px-3 py-2.5 align-middle">
                          <button
                            type="button"
                            disabled={!canEdit || busyId === row.id}
                            onClick={() => void toggleDone(row)}
                            className={cn(
                              "inline-flex size-8 items-center justify-center rounded-full border border-flowpm-border transition-colors",
                              row.status === "done" ? "border-[#0f6e56]/40 bg-[#0f6e56]/10 text-[#0f6e56]" : "text-flowpm-muted hover:bg-flowpm-canvas",
                            )}
                            title={canEdit ? (row.status === "done" ? "Mark not done" : "Mark done") : "View only"}
                          >
                            {row.status === "done" ? <Check className="size-4" /> : <Circle className="size-4" />}
                          </button>
                        </td>
                        <td className="max-w-[220px] px-3 py-2.5 font-medium text-flowpm-body">
                          <span className="line-clamp-2">{row.title}</span>
                        </td>
                        <td className="px-3 py-2.5 text-flowpm-muted">
                          <Link
                            href={`/projects/${row.projectId}`}
                            className="text-flowpm-primary hover:underline"
                          >
                            {row.projectName}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-flowpm-canvas text-[10px] font-semibold text-flowpm-body">
                              {initialsFromName(assignee === "—" ? "?" : assignee)}
                            </span>
                            <span className="truncate text-flowpm-body">{assignee}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "font-normal capitalize",
                              row.status === "done" && "bg-[#dcfce7] text-[#166534]",
                              row.status === "todo" && "bg-flowpm-canvas text-flowpm-muted",
                              row.status === "in_progress" && "bg-flowpm-primary-light text-flowpm-primary",
                              row.status === "review" && "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200",
                            )}
                          >
                            {STATUS_LABELS[row.status]}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "text-xs font-medium capitalize",
                              pri === "high" && "text-red-600",
                              pri === "medium" && "text-orange-600",
                              pri === "low" && "text-[#0f6e56]",
                            )}
                          >
                            {pri}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-flowpm-muted">{formatDue(row.dueDate)}</td>
                        <td className="px-1 py-2.5 align-middle">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              type="button"
                              className="inline-flex size-8 items-center justify-center rounded-md text-flowpm-body ring-offset-background transition-colors hover:bg-flowpm-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flowpm-primary focus-visible:ring-offset-2"
                              aria-label="Task actions"
                            >
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/projects/${row.projectId}`)}>
                                Open project
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageMotion>
  );
}
