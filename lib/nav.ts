import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Clock,
  Settings,
} from "lucide-react";

export const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/team", label: "Team", icon: Users },
  { href: "/time", label: "Time", icon: Clock },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function titleForPath(pathname: string): string {
  if (pathname.startsWith("/projects/") && pathname !== "/projects")
    return "Project";
  const map: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/projects": "Projects",
    "/team": "Team",
    "/time": "Time & billing",
    "/settings": "Settings",
  };
  return map[pathname] ?? "FlowPM";
}
