import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FirebaseEnvMissingMessage() {
  return (
    <Card className="border-flowpm-border shadow-card">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Firebase not configured</CardTitle>
        <p className="text-sm font-normal text-flowpm-muted">
          This deployment is missing public Firebase settings.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-flowpm-muted">
        <p>
          In Vercel: <strong>Project → Settings → Environment Variables</strong>, add every variable from{" "}
          <code className="rounded bg-flowpm-canvas px-1 py-0.5 text-xs">.env.example</code> (all{" "}
          <code className="text-xs">NEXT_PUBLIC_FIREBASE_*</code> keys with your Firebase web app values).
        </p>
        <p>
          Then <strong>redeploy</strong>. <code className="text-xs">NEXT_PUBLIC_*</code> values are embedded at
          build time, so a new deployment is required after you save env vars.
        </p>
      </CardContent>
    </Card>
  );
}
