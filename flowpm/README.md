# FlowPM

Project management SaaS scaffold based on **FlowPM_Build_Guide.docx** — agencies: clients, projects, Kanban-style tasks, time, billing (roadmap).

## Stack (from guide)

- **Next.js 14** (App Router), **Tailwind**, **shadcn/ui** (Base UI), **Framer Motion**, **Zustand**, **React Hook Form** + **Zod**
- **Prisma 7** + **SQLite** locally (swap `DATABASE_URL` to **Supabase Postgres** for production)
- **NextAuth**, **Stripe**, **Resend** — not wired yet (see guide weeks 3–4, 16)

## Run locally

```bash
cd flowpm
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — landing → **Open app (demo)** or `/dashboard`.

## What’s implemented (MVP shell)

- FlowPM **color palette**, **Plus Jakarta Sans** + **Inter**, sidebar + top bar (guide layout)
- **Dashboard** — stat cards, projects progress, my tasks, activity (sample data)
- **Projects** — grid, **New project** form (React Hook Form), **project detail** with tabs + Kanban columns (static cards; drag-and-drop next)
- **Team**, **Time**, **Settings** — UI placeholders
- **Login / Signup / Forgot password** — UI only (redirects to dashboard for demo)
- **Prisma schema** — `User`, `Organization`, `OrgMember`, `Client`, `Project`, `Task`, `TaskComment`, `TimeEntry`, `Invoice` per guide §03

## Next steps (guide)

1. **Supabase** + move `DATABASE_URL` to Postgres; keep Prisma migrations.
2. **NextAuth.js** (Google + email) and org onboarding.
3. **API routes / Server Actions** for CRUD; replace mock data.
4. **@dnd-kit** (or similar) for Kanban; **Stripe** + **Resend** per roadmap.

Deploy on **Vercel**; set env vars and run `prisma migrate deploy` in CI.
