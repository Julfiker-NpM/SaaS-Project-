"use client";

import { PageMotion } from "@/components/flowpm/page-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, FolderOpen, Users } from "lucide-react";
import Link from "next/link";

export type DashboardStats = {
  activeProjects: number;
  projectsThisMonth: number;
  tasksDueToday: number;
  highPriorityDueToday: number;
  hoursWeek: number;
  memberCount: number;
};

export type DashboardProject = {
  id: string;
  name: string;
  progress: number;
  clientLabel: string;
  color: string;
};

export type DashboardTask = {
  id: string;
  title: string;
  projectName: string;
  dueLabel: string;
};

export type DashboardActivity = {
  id: string;
  who: string;
  action: string;
  when: string;
};

export function DashboardClient(props: {
  stats: DashboardStats;
  projects: DashboardProject[];
  myTasks: DashboardTask[];
  activity: DashboardActivity[];
}) {
  const { stats, projects, myTasks, activity } = props;

  const statCards = [
    {
      label: "Active projects",
      value: String(stats.activeProjects),
      icon: FolderOpen,
      hint:
        stats.projectsThisMonth > 0
          ? `+${stats.projectsThisMonth} started this month`
          : "No new projects this month",
    },
    {
      label: "Tasks due today",
      value: String(stats.tasksDueToday),
      icon: CheckCircle2,
      hint:
        stats.highPriorityDueToday > 0
          ? `${stats.highPriorityDueToday} high priority`
          : "None high priority",
    },
    {
      label: "Hours this week",
      value: stats.hoursWeek % 1 === 0 ? String(stats.hoursWeek) : stats.hoursWeek.toFixed(1),
      icon: Clock,
      hint: "Team total (last 7 days)",
    },
    {
      label: "Team members",
      value: String(stats.memberCount),
      icon: Users,
      hint: "In this workspace",
    },
  ];

  return (
    <PageMotion>
      <p className="mb-8 text-sm text-flowpm-muted">
        Overview of your agency — projects, tasks, time, and recent comments.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, hint }) => (
          <Card
            key={label}
            className="border-flowpm-border shadow-card transition-all duration-120 hover:-translate-y-px hover:border-[#C0C0D0] hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-flowpm-muted">{label}</CardTitle>
              <Icon className="size-4 text-flowpm-primary" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="font-heading text-2xl font-bold text-flowpm-dark">{value}</p>
              <p className="text-xs text-flowpm-muted">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <Card className="border-flowpm-border shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Projects</CardTitle>
            <p className="text-sm text-flowpm-muted">Latest projects and completion</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {projects.length === 0 ? (
              <p className="text-sm text-flowpm-muted">No projects yet. Create one from Projects.</p>
            ) : (
              projects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="block space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: p.color }}
                        aria-hidden
                      />
                      <span className="font-medium text-flowpm-body">{p.name}</span>
                    </div>
                    <Badge variant="secondary" className="bg-[#EEEDFE] text-[#534AB7]">
                      {p.clientLabel}
                    </Badge>
                  </div>
                  <Progress value={p.progress} className="h-2 bg-flowpm-canvas" />
                  <div className="flex justify-between text-xs text-flowpm-muted">
                    <span>Progress</span>
                    <span>{p.progress}%</span>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-flowpm-border shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">My tasks today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {myTasks.length === 0 ? (
                <p className="text-sm text-flowpm-muted">No tasks assigned to you due today.</p>
              ) : (
                myTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-flowpm-border p-3 transition-colors hover:bg-flowpm-canvas/80"
                  >
                    <div>
                      <p className="text-sm font-medium text-flowpm-body">{t.title}</p>
                      <p className="text-xs text-flowpm-muted">{t.projectName}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-amber-200 bg-[#FAEEDA] text-[#854F0B]"
                    >
                      {t.dueLabel}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-flowpm-border shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activity.length === 0 ? (
                <p className="text-sm text-flowpm-muted">No comments yet.</p>
              ) : (
                activity.map((a, i) => (
                  <div key={a.id}>
                    <div className="flex gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-[#EEEDFE] text-xs text-[#534AB7]">
                          {a.who[0]?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm text-flowpm-body">
                          <span className="font-medium">{a.who}</span> {a.action}
                        </p>
                        <p className="text-xs text-flowpm-muted">{a.when}</p>
                      </div>
                    </div>
                    {i < activity.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageMotion>
  );
}
