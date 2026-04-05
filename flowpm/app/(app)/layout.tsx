import { FlowAuthProvider } from "@/context/flowpm-auth-context";
import { AppShell } from "./app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FlowAuthProvider>
      <AppShell>{children}</AppShell>
    </FlowAuthProvider>
  );
}
