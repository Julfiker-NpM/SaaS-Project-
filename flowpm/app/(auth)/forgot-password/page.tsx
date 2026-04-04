import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  return (
    <Card className="border-flowpm-border shadow-card">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Reset password</CardTitle>
        <p className="text-sm text-flowpm-muted">We&apos;ll email you a reset link.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" className="h-10" />
        </div>
        <Button className="h-10 w-full bg-flowpm-primary hover:bg-flowpm-primary-hover">
          Send reset link
        </Button>
        <p className="text-center text-sm">
          <Link href="/login" className="text-flowpm-primary hover:underline">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
