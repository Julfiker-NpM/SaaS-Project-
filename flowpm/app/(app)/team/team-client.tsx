"use client";

import { PageMotion } from "@/components/flowpm/page-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type TeamMemberRow = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function initials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return email[0]?.toUpperCase() ?? "?";
}

export function TeamClient({ members }: { members: TeamMemberRow[] }) {
  return (
    <PageMotion>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-flowpm-muted">
          Invite members and assign roles (Admin / Member / Viewer).
        </p>
        <Button type="button" className="h-10 bg-flowpm-primary hover:bg-flowpm-primary-hover" disabled>
          Invite member
        </Button>
      </div>
      <Card className="border-flowpm-border shadow-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Team</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {members.length === 0 ? (
            <p className="text-sm text-flowpm-muted">No members yet.</p>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-flowpm-border pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-[#EEEDFE] text-[#534AB7]">
                      {initials(m.name, m.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-flowpm-body">{m.name || m.email}</p>
                    <p className="text-xs text-flowpm-muted">{m.email}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-[#EEEDFE] text-[#534AB7] capitalize">
                  {m.role}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </PageMotion>
  );
}
