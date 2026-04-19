"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { firestoreToDate } from "@/lib/firebase/firestore-dates";
import { PageMotion } from "@/components/flowpm/page-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { canMutateWorkspaceContent } from "@/lib/flowpm/access";
import { ExternalLink, Mail, MoreHorizontal, Phone, Plus } from "lucide-react";

export type ClientDoc = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
  createdAt: Date | null;
};

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0] ?? ""}${p[p.length - 1]?.[0] ?? ""}`.toUpperCase();
}

function formatBdtCompact(n: number) {
  if (n >= 100_000) return `৳${(n / 100_000).toFixed(1)}L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(1)}k`;
  return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(n);
}

export function ClientsPageClient(props: { orgId: string; memberRole: string | null }) {
  const { orgId, memberRole } = props;
  const router = useRouter();
  const db = getFirebaseDb();
  const canEdit = canMutateWorkspaceContent(memberRole);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientDoc[]>([]);
  const [projectCountByClient, setProjectCountByClient] = useState<Map<string, number>>(new Map());
  const [invoicedByClient, setInvoicedByClient] = useState<Map<string, number>>(new Map());
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [clientSnap, projSnap, invSnap] = await Promise.all([
        getDocs(collection(db, "organizations", orgId, "clients")),
        getDocs(collection(db, "organizations", orgId, "projects")),
        getDocs(collection(db, "organizations", orgId, "invoices")),
      ]);

      const rows: ClientDoc[] = clientSnap.docs.map((d) => {
        const x = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          name: String(x.name ?? "").trim() || "Unnamed client",
          companyName: x.companyName != null ? String(x.companyName).trim() || null : null,
          email: x.email != null ? String(x.email).trim() || null : null,
          phone: x.phone != null ? String(x.phone).trim() || null : null,
          active: x.active === false ? false : true,
          createdAt: firestoreToDate(x.createdAt),
        };
      });
      rows.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
      setClients(rows);

      const projPerClient = new Map<string, number>();
      const projectClient = new Map<string, string | null>();
      projSnap.docs.forEach((d) => {
        const x = d.data() as Record<string, unknown>;
        const cid = (x.clientId as string | null | undefined) ?? null;
        projectClient.set(d.id, cid);
        if (cid) projPerClient.set(cid, (projPerClient.get(cid) ?? 0) + 1);
      });

      const invMap = new Map<string, number>();
        for (const invDoc of invSnap.docs) {
          const x = invDoc.data() as Record<string, unknown>;
        const status = String(x.status ?? "");
        if (status !== "paid" && status !== "sent") continue;
        const lineItems = (x.lineItems as { projectId?: string; amount?: number }[] | undefined) ?? [];
        const total = typeof x.total === "number" ? x.total : 0;
        const currency = String(x.currency ?? "USD").trim().toUpperCase();
        if (currency !== "BDT") continue;
        if (lineItems.length === 0) continue;
        for (const line of lineItems) {
          const pid = line.projectId;
          if (!pid) continue;
          const clientId = projectClient.get(pid);
          if (!clientId) continue;
          let amt = typeof line.amount === "number" ? line.amount : 0;
          if (amt <= 0 && total > 0) amt = total / lineItems.length;
          invMap.set(clientId, (invMap.get(clientId) ?? 0) + amt);
        }
      }

      setProjectCountByClient(projPerClient);
      setInvoicedByClient(invMap);
    } catch {
      setError("Could not load clients.");
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [db, orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((c) => c.active).length;
    const activeProjects = Array.from(projectCountByClient.values()).reduce((a, b) => a + b, 0);
    const revenue = Array.from(invoicedByClient.values()).reduce((a, b) => a + b, 0);
    return { total, active, activeProjects, revenue };
  }, [clients, projectCountByClient, invoicedByClient]);

  async function onAddClient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canEdit) return;
    const form = e.currentTarget;
    const name = (form.elements.namedItem("cname") as HTMLInputElement).value.trim();
    const company = (form.elements.namedItem("company") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value.trim();
    if (name.length < 2) {
      setError("Client name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addDoc(collection(db, "organizations", orgId, "clients"), {
        name,
        companyName: company || null,
        email: email || null,
        phone: phone || null,
        active: true,
        createdAt: serverTimestamp(),
      });
      form.reset();
      setFormOpen(false);
      await load();
    } catch {
      setError("Could not add client.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageMotion>
        <p className="text-sm text-flowpm-muted">Loading clients…</p>
      </PageMotion>
    );
  }

  return (
    <PageMotion>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold text-flowpm-dark">Clients</h2>
          <p className="mt-1 text-sm text-flowpm-muted">Manage your client relationships.</p>
        </div>
        {canEdit ? (
          <Button
            type="button"
            className="h-10 bg-flowpm-primary hover:bg-flowpm-primary-hover"
            onClick={() => setFormOpen((v) => !v)}
          >
            <Plus className="mr-2 size-4" />
            {formOpen ? "Close form" : "Add client"}
          </Button>
        ) : null}
      </div>

      {error ? <p className="mb-4 text-sm text-flowpm-danger">{error}</p> : null}

      {formOpen && canEdit ? (
        <Card className="mb-6 border-flowpm-border shadow-card">
          <CardHeader>
            <CardTitle className="font-heading text-base">New client</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(ev) => void onAddClient(ev)} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cname">Name</Label>
                <Input id="cname" name="cname" required minLength={2} className="h-10" placeholder="e.g. Robert Anderson" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="company">Company (optional)</Label>
                <Input id="company" name="company" className="h-10" placeholder="TechCorp Industries" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input id="email" name="email" type="email" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" name="phone" className="h-10" />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving} className="h-10 bg-flowpm-primary hover:bg-flowpm-primary-hover">
                  {saving ? "Saving…" : "Save client"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-flowpm-border shadow-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-flowpm-muted">Total clients</p>
            <p className="mt-1 font-heading text-2xl font-semibold text-flowpm-primary">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-flowpm-border shadow-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-flowpm-muted">Active clients</p>
            <p className="mt-1 font-heading text-2xl font-semibold text-[#0f6e56]">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="border-flowpm-border shadow-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-flowpm-muted">Linked projects</p>
            <p className="mt-1 font-heading text-2xl font-semibold text-orange-600">{stats.activeProjects}</p>
          </CardContent>
        </Card>
        <Card className="border-flowpm-border shadow-card">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-flowpm-muted">Invoiced (BDT, paid/sent)</p>
            <p className="mt-1 font-heading text-2xl font-semibold text-flowpm-dark">
              {stats.revenue > 0 ? formatBdtCompact(stats.revenue) : "৳0"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {clients.length === 0 ? (
          <p className="text-sm text-flowpm-muted md:col-span-2 xl:col-span-3">No clients yet. Add one or create a project with a client name.</p>
        ) : (
          clients.map((c) => {
            const projects = projectCountByClient.get(c.id) ?? 0;
            const invoiced = invoicedByClient.get(c.id) ?? 0;
            const company = c.companyName || "—";
            return (
              <Card key={c.id} className="border-flowpm-border shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-flowpm-primary-light text-sm font-semibold text-flowpm-primary">
                        {initials(c.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-flowpm-body">{c.name}</p>
                        <p className="truncate text-xs text-flowpm-muted">{company}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        type="button"
                        className={cn(
                          "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-flowpm-body ring-offset-background transition-colors hover:bg-flowpm-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flowpm-primary focus-visible:ring-offset-2",
                        )}
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push("/projects")}>View projects</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-3">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs font-normal",
                        c.active ? "bg-[#dcfce7] text-[#166534]" : "bg-flowpm-canvas text-flowpm-muted",
                      )}
                    >
                      {c.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-flowpm-muted">
                    {c.email ? (
                      <p className="flex items-center gap-2 truncate">
                        <Mail className="size-3.5 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </p>
                    ) : null}
                    {c.phone ? (
                      <p className="flex items-center gap-2 truncate">
                        <Phone className="size-3.5 shrink-0" />
                        <span className="truncate">{c.phone}</span>
                      </p>
                    ) : null}
                    {!c.email && !c.phone ? <p className="text-xs">No contact on file</p> : null}
                  </div>
                  <div className="mt-4 flex gap-6 text-sm">
                    <div>
                      <p className="text-xs text-flowpm-muted">Projects</p>
                      <p className="font-medium text-flowpm-body">{projects}</p>
                    </div>
                    <div>
                      <p className="text-xs text-flowpm-muted">Invoiced</p>
                      <p className="font-medium text-flowpm-body">{invoiced > 0 ? formatBdtCompact(invoiced) : "—"}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-9 flex-1"
                      onClick={() => router.push("/projects")}
                    >
                      View projects
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 shrink-0"
                      aria-label="Invoices"
                      onClick={() => router.push("/invoices")}
                    >
                      <ExternalLink className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </PageMotion>
  );
}
