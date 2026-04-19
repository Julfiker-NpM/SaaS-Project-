import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Users,
  Clock,
  ContactRound,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react";

export const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/time", label: "Time", icon: Clock },
  { href: "/clients", label: "Clients", icon: ContactRound },
  { href: "/team", label: "Team", icon: Users },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function titleForPath(pathname: string): string {
  if (pathname.startsWith("/projects/") && pathname !== "/projects")
    return "Project";
  const map: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/projects": "Projects",
    "/tasks": "Tasks",
    "/clients": "Clients",
    "/team": "Team",
    "/time": "Time & billing",
    "/reports": "Reports",
    "/invoices": "Invoices",
    "/settings": "Settings",
    "/billing/payment-submit": "Confirm payment",
  };
  return map[pathname] ?? "FlowPM";
}
