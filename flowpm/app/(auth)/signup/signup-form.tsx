"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { signupAction, type AuthFormState } from "@/app/actions/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const [state, formAction] = useFormState(signupAction, null as AuthFormState);

  return (
    <Card className="border-flowpm-border shadow-card">
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-2xl text-flowpm-dark">Create workspace</CardTitle>
        <p className="text-sm text-flowpm-muted">Start your agency on FlowPM</p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" name="name" required minLength={2} autoComplete="name" className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org">Organization name</Label>
            <Input
              id="org"
              name="org"
              required
              minLength={2}
              placeholder="Acme Digital"
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-10"
            />
          </div>
          {state?.error ? <p className="text-xs text-flowpm-danger">{state.error}</p> : null}
          <Button type="submit" className="h-10 w-full bg-flowpm-primary hover:bg-flowpm-primary-hover">
            Create account
          </Button>
          <p className="text-center text-sm text-flowpm-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-flowpm-primary hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
