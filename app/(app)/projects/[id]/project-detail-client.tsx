"use client";

import { PageMotion } from "@/components/flowpm/page-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type BoardColumn = {
  id: string;
  title: string;
  tasks: { id: string; title: string }[];
};

export function ProjectDetailClient(props: { projectId: string; name: string; columns: BoardColumn[] }) {
  const { projectId, name, columns } = props;

  return (
    <PageMotion>
      <p className="mb-6 text-sm text-flowpm-muted">
        <span className="font-medium text-flowpm-body">{name}</span>
        <span className="text-flowpm-muted"> · </span>
        <span className="font-mono text-xs">#{projectId.slice(0, 8)}</span>
      </p>

      <Tabs defaultValue="board" className="w-full">
        <TabsList className="mb-6 grid w-full max-w-lg grid-cols-5 bg-flowpm-surface">
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="mt-0">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {columns.map((col) => (
              <div
                key={col.id}
                className="rounded-xl border border-flowpm-border bg-flowpm-surface p-3 shadow-card"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-heading text-sm font-semibold text-flowpm-dark">{col.title}</h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {col.tasks.length}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2">
                  {col.tasks.length === 0 ? (
                    <p className="text-xs text-flowpm-muted">No tasks</p>
                  ) : (
                    col.tasks.map((t) => (
                      <Card
                        key={t.id}
                        className="cursor-grab border-flowpm-border shadow-none transition-transform duration-100 active:scale-[0.97]"
                      >
                        <CardContent className="p-3 text-sm text-flowpm-body">{t.title}</CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="list">
          <Card className="border-flowpm-border">
            <CardContent className="p-6 text-sm text-flowpm-muted">
              Table view uses the same tasks as the board; filters coming next.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="timeline">
          <Card className="border-flowpm-border">
            <CardContent className="p-6 text-sm text-flowpm-muted">
              Timeline from task due dates.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="files">
          <Card className="border-flowpm-border">
            <CardContent className="p-6 text-sm text-flowpm-muted">
              Attachments will live here.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card className="border-flowpm-border">
            <CardContent className="p-6 text-sm text-flowpm-muted">
              Edit name, client, color, and due date from workspace settings flows next.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageMotion>
  );
}
