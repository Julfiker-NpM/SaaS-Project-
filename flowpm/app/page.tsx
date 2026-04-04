import Link from "next/link";
import {
  BarChart3,
  ClipboardList,
  FileText,
  Link2,
  Timer,
  Users,
} from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Project Board",
    desc: "Kanban & list views with drag-and-drop",
  },
  {
    icon: Timer,
    title: "Time Tracking",
    desc: "Track hours per task, generate reports",
  },
  {
    icon: FileText,
    title: "Invoicing",
    desc: "Auto-generate invoices from tracked time",
  },
  {
    icon: Users,
    title: "Team Roles",
    desc: "Admin, member, viewer permissions",
  },
  {
    icon: Link2,
    title: "Client Portal",
    desc: "Shareable read-only project view",
  },
  {
    icon: BarChart3,
    title: "Reports",
    desc: "Hours, completion rate, workload charts",
  },
] as const;

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0c29] font-sans">
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow orbs */}
      <div
        className="pointer-events-none absolute -right-20 -top-32 h-[500px] w-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(circle,rgba(83,74,183,0.35) 0%,transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 h-[350px] w-[350px] rounded-full"
        style={{
          background:
            "radial-gradient(circle,rgba(127,119,221,0.2) 0%,transparent 70%)",
        }}
      />

      {/* Navbar */}
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-heading text-xl font-bold tracking-tight text-white">
          Flow<span className="text-[#7F77DD]">PM</span>
        </span>
        <div className="flex gap-3">
          <Link href="/login"
            className="inline-flex h-10 items-center rounded-lg border border-white/10 px-5 text-sm text-white/70 hover:bg-white/5">
            Log in
          </Link>
          <Link href="/signup"
            className="inline-flex h-10 items-center rounded-lg bg-[#534AB7] px-5 text-sm font-medium text-white hover:bg-[#3C3489]">
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-3xl px-6 pb-24 pt-14 text-center">
        <div className="mb-5 inline-block rounded-full border border-[#7F77DD]/40 bg-[#7F77DD]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[#AFA9EC]">
          Agency Project Management
        </div>

        <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
          One workspace for{" "}
          <span className="bg-gradient-to-r from-[#7F77DD] to-[#AFA9EC] bg-clip-text text-transparent">
            clients, projects & time
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/50">
          Built for teams of 5–50. Client portal, time tracking, and invoicing — without juggling five tools.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7F77DD] px-8 text-sm font-semibold text-white shadow-lg shadow-[#534AB7]/30 hover:opacity-90"
          >
            Open dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center rounded-xl border border-white/20 px-8 text-sm text-white/80 hover:bg-white/5"
          >
            Sign in
          </Link>
        </div>

        {/* Feature cards */}
        <div className="mt-16 grid grid-cols-2 gap-3 text-left sm:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-white/[0.08] bg-white/[0.05] p-4 backdrop-blur-sm transition-colors hover:border-white/[0.12]"
            >
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-[#534AB7]/20 text-[#AFA9EC]">
                <Icon className="size-4" strokeWidth={1.75} aria-hidden />
              </div>
              <div className="text-sm font-semibold text-white">{title}</div>
              <div className="mt-1 text-xs leading-relaxed text-white/40">{desc}</div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs text-white/25">
          Starter free · Pro $19/mo · Agency $49/mo
        </p>
      </main>
    </div>
  );
}