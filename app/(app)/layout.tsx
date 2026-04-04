import { AppSidebar } from "@/components/flowpm/app-sidebar";
import { TopBar } from "@/components/flowpm/top-bar";
import { getSessionUser } from "@/lib/session-user";
import { getMembershipForUser } from "@/lib/org";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const member = await getMembershipForUser(user.id);
  const organizationName = member?.org.name ?? "Workspace";

  return (
    <div className="flex min-h-screen bg-flowpm-canvas">
      <AppSidebar
        userDisplayName={user.name?.trim() || user.email.split("@")[0] || "Account"}
        userEmail={user.email}
        organizationName={organizationName}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          user={{ name: user.name, email: user.email }}
          organizationName={organizationName}
        />
        <div className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
