"use client";

import { useFormState } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { updateWorkspaceAction, type OrgFormState } from "@/app/actions/org";

export function WorkspaceForm(props: { orgName: string; plan: string }) {
  const { orgName, plan } = props;
  const [state, formAction] = useFormState(updateWorkspaceAction, null as OrgFormState);

  const planLabel = plan === "free" ? "Free" : plan === "pro" ? "Pro" : plan;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-flowpm-border shadow-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Workspace name</Label>
              <Input
                id="orgName"
                name="orgName"
                className="h-10"
                defaultValue={orgName}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tz">Timezone</Label>
              <Input id="tz" name="tz" className="h-10" defaultValue="UTC" disabled />
              <p className="text-xs text-flowpm-muted">Timezone on the account will follow in a later release.</p>
            </div>
            {state?.error ? <p className="text-xs text-flowpm-danger">{state.error}</p> : null}
            {state?.ok ? <p className="text-xs text-[#0F6E56]">Saved.</p> : null}
            <Button type="submit" className="h-10 bg-flowpm-primary hover:bg-flowpm-primary-hover">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="border-flowpm-border shadow-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-flowpm-muted">
          <p>
            Plan: <strong className="text-flowpm-body">{planLabel}</strong>
          </p>
          <Separator />
          <p>Upgrade and customer portal can connect to Stripe when you enable billing.</p>
          <Button variant="outline" className="h-10" type="button" disabled>
            Manage subscription
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
