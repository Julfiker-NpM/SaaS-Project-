"use client";

import { PageMotion } from "@/components/flowpm/page-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type TimeEntryRow = {
  id: string;
  hours: number;
  description: string | null;
  projectName: string;
  dateLabel: string;
};

export function TimeClient(props: { todayEntries: TimeEntryRow[]; weekHours: number }) {
  const { todayEntries, weekHours } = props;
  const weekLabel = weekHours % 1 === 0 ? String(weekHours) : weekHours.toFixed(1);

  return (
    <PageMotion>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-flowpm-muted">
          Logged time for this workspace. Timer controls can plug in here.
        </p>
        <Button type="button" className="h-10 bg-flowpm-primary hover:bg-flowpm-primary-hover" disabled>
          Start timer
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-flowpm-border shadow-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {todayEntries.length === 0 ? (
              <p className="text-flowpm-muted">No time entries for today yet.</p>
            ) : (
              <ul className="space-y-3">
                {todayEntries.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-flowpm-border pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-flowpm-body">{e.projectName}</p>
                      <p className="text-xs text-flowpm-muted">
                        {e.description || "No description"} · {e.dateLabel}
                      </p>
                    </div>
                    <span className="text-flowpm-body tabular-nums">
                      {e.hours % 1 === 0 ? e.hours : e.hours.toFixed(1)}h
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="border-flowpm-border shadow-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg">This week (you)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-flowpm-muted">
            <p>
              Total: <strong className="text-flowpm-body">{weekLabel}h</strong> logged in the last 7 days.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageMotion>
  );
}
