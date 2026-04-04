"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { PageMotion } from "@/components/flowpm/page-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProjectAction, type ProjectFormState } from "@/app/actions/projects";

export function NewProjectForm() {
  const [state, formAction] = useFormState(createProjectAction, null as ProjectFormState);

  return (
    <PageMotion>
      <Card className="mx-auto max-w-lg border-flowpm-border shadow-card">
        <CardHeader>
          <CardTitle className="font-heading">New project</CardTitle>
          <p className="text-sm text-flowpm-muted">Name, client, and due date.</p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">
                Project name <span className="text-flowpm-danger">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                required
                minLength={2}
                className="h-10"
                placeholder="e.g. Acme rebrand"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Input id="client" name="client" className="h-10" placeholder="Company name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due">Due date</Label>
              <Input id="due" name="due" type="date" className="h-10" />
            </div>
            {state?.error ? <p className="text-xs text-flowpm-danger">{state.error}</p> : null}
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="h-10 bg-flowpm-primary hover:bg-flowpm-primary-hover">
                Create project
              </Button>
              <Link
                href="/projects"
                className={cn(buttonVariants({ variant: "outline" }), "inline-flex h-10 items-center px-4")}
              >
                Cancel
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageMotion>
  );
}
