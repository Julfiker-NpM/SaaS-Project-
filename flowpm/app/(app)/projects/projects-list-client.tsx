"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageMotion } from "@/components/flowpm/page-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { canMutateWorkspaceContent } from "@/lib/flowpm/access";
import {
  FREE_PLAN_MAX_PROJECTS,
  freePlanProjectLimitMessage,
  isFreePlan,
} from "@/lib/flowpm/plan-limits";

export type ProjectListItem = {
  id: string;
  name: string;
  clientLabel: string;
  status: string;
  progress: number;
  dueLabel: string;
  color: string;
};

const statusBadge: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  review: "bg-amber-500/15 text-amber-900 dark:text-amber-200",
  hold: "bg-flowpm-canvas text-flowpm-muted dark:bg-white/10",
};

export function ProjectsListClient(props: {
  projects: ProjectListItem[];
  memberRole: string | null;
  orgPlan: string | null | undefined;
}) {
  const { projects, memberRole, orgPlan } = props;
  const canMutate = canMutateWorkspaceContent(memberRole);
  const atFreeProjectCap = isFreePlan(orgPlan) && projects.length >= FREE_PLAN_MAX_PROJECTS;

  return (
    <PageMotion>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-flowpm-dark">Projects</h1>
          <p className="mt-1 text-sm text-flowpm-muted">All client work in one place — open a card to manage tasks.</p>
        </div>
        {canMutate ? (
          atFreeProjectCap ? (
            <span
              title={freePlanProjectLimitMessage(FREE_PLAN_MAX_PROJECTS)}
              className={cn(
                buttonVariants({ variant: "default" }),
                "pointer-events-none inline-flex h-10 w-full shrink-0 cursor-not-allowed items-center justify-center gap-2 opacity-50 sm:w-auto",
              )}
            >
              <Plus className="size-4" aria-hidden />
              New project
            </span>
          ) : (
            <Link
              href="/projects/new"
              className={cn(
                buttonVariants({ variant: "default" }),
                "inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 bg-flowpm-primary hover:bg-flowpm-primary-hover sm:w-auto",
              )}
            >
              <Plus className="size-4" aria-hidden />
              New project
            </Link>
          )
        ) : null}
      </div>
      {canMutate && atFreeProjectCap ? (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-flowpm-body dark:text-amber-100/90">
          {freePlanProjectLimitMessage(FREE_PLAN_MAX_PROJECTS)}
        </p>
      ) : null}
      {projects.length === 0 ? (
        <p className="text-sm text-flowpm-muted">
          No projects yet.{" "}
          {canMutate ? (
            atFreeProjectCap ? (
              <span className="text-flowpm-body">{freePlanProjectLimitMessage(FREE_PLAN_MAX_PROJECTS)}</span>
            ) : (
              <>
                <Link href="/projects/new" className="font-medium text-flowpm-primary hover:underline">
                  Create a project
                </Link>
                .
              </>
            )
          ) : (
            <>Ask a workspace admin to grant member access if you need to create projects.</>
          )}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="block min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-flowpm-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-flowpm-canvas rounded-xl">
              <Card className="h-full border-flowpm-border shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-flowpm-primary/30 hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <CardTitle className="font-heading text-base">{p.name}</CardTitle>
                    </div>
                    <Badge
                      className={
                        statusBadge[p.status] ?? "bg-flowpm-canvas text-flowpm-muted capitalize"
                      }
                    >
                      {p.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-flowpm-muted">{p.clientLabel}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Progress value={p.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-flowpm-muted">
                    <span>Due {p.dueLabel}</span>
                    <span>{p.progress}%</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageMotion>
  );
}
