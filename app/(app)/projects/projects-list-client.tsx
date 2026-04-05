"use client";

import Link from "next/link";
import { PageMotion } from "@/components/flowpm/page-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
  active: "bg-[#E1F5EE] text-[#0F6E56]",
  review: "bg-[#FAEEDA] text-[#854F0B]",
  hold: "bg-[#F1EFE8] text-[#5F5E5A]",
};

export function ProjectsListClient({ projects }: { projects: ProjectListItem[] }) {
  return (
    <PageMotion>
      <p className="mb-6 text-sm text-flowpm-muted">All client work in one place.</p>
      {projects.length === 0 ? (
        <p className="text-sm text-flowpm-muted">
          No projects yet.{" "}
          <Link href="/projects/new" className="font-medium text-flowpm-primary hover:underline">
            Create a project
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="h-full border-flowpm-border shadow-card transition-all duration-120 hover:-translate-y-px hover:border-[#C0C0D0] hover:shadow-md">
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
