"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { loginAction, type AuthFormState } from "@/app/actions/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction] = useFormState(loginAction, null as AuthFormState);

  return (
    <Card className="border-flowpm-border shadow-card">
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-2xl text-flowpm-dark">Welcome back</CardTitle>
        <p className="text-sm text-flowpm-muted">Sign in to FlowPM</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="next" value={nextPath} />
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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
              autoComplete="current-password"
              className="h-10"
            />
          </div>
          {state?.error ? <p className="text-xs text-flowpm-danger">{state.error}</p> : null}
          <Button type="submit" className="h-10 w-full bg-flowpm-primary hover:bg-flowpm-primary-hover">
            Sign in
          </Button>
        </form>
        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-flowpm-surface px-2 text-xs text-flowpm-muted">
            or
          </span>
        </div>
        <Button variant="outline" type="button" className="h-10 w-full" disabled>
          Continue with Google
        </Button>
        <p className="text-center text-sm text-flowpm-muted">
          <Link href="/forgot-password" className="text-flowpm-primary hover:underline">
            Forgot password?
          </Link>
        </p>
        <p className="text-center text-sm text-flowpm-muted">
          No account?{" "}
          <Link href="/signup" className="font-medium text-flowpm-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
