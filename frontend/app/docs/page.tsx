import Link from "next/link";
import { ArrowRight, Cloud, FolderTree, LockKeyhole, Mail, ShieldCheck, Upload } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";

const features = [
  { icon: Upload, title: "Upload without the worry", description: "Drag in files of any size. Large uploads can resume after a refresh or a dropped connection." },
  { icon: FolderTree, title: "Keep everything organized", description: "Use nested folders to keep projects, assets, and shared files easy to find." },
  { icon: LockKeyhole, title: "Share on your terms", description: "Create public or private links with passwords, expiration dates, download limits, and permissions." },
  { icon: ShieldCheck, title: "Security built in", description: "Ownership checks, hashed passwords, rate limits, and short-lived signed download URLs protect access." },
];

const stack = [
  ["Frontend", "Next.js, React, Tailwind CSS, shadcn/ui"],
  ["API", "Node.js, Express, TypeScript"],
  ["Data", "PostgreSQL with Prisma ORM"],
  ["Storage", "Supabase Storage"],
  ["Jobs", "Redis with BullMQ"],
  ["Email", "Resend transactional email"],
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <section className="max-w-3xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">CloudShary / Docs</p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">A calmer way to move files around.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">CloudShary gives teams one secure place to upload, organize, and share files without losing control of who can access them.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/demo" className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800">See the workflow <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:border-zinc-400">Open dashboard</Link>
          </div>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, description }) => (
            <article key={title} className="border border-zinc-200 bg-white p-6">
              <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-md bg-zinc-950 text-white"><Icon className="h-5 w-5" /></div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">{description}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 grid gap-10 border-t border-zinc-200 pt-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">The essentials</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">From first upload to final download.</h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-600">Files stay in object storage while the database keeps the metadata and access rules. That separation keeps the app quick and makes permissions explicit.</p>
          </div>
          <div className="divide-y divide-zinc-200 border-y border-zinc-200 bg-white">
            {[
              ["01", "Create an account", "Register, verify your email, and sign in with protected sessions."],
              ["02", "Upload and organize", "Drop files into the dashboard, then move them into nested folders."],
              ["03", "Create a share link", "Choose visibility, password protection, expiration, and permissions."],
              ["04", "Stay in control", "Revoke access, monitor links, or manage users from the admin area."],
            ].map(([number, title, description]) => (
              <div key={number} className="grid grid-cols-[3rem_1fr] gap-4 p-5">
                <span className="font-mono text-xs text-zinc-400">{number}</span>
                <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-zinc-600">{description}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 border border-zinc-200 bg-zinc-950 p-6 text-white sm:p-8">
          <div className="flex items-start gap-4"><Cloud className="mt-1 h-5 w-5 shrink-0 text-zinc-400" /><div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Built for the real world</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Reliable storage, clear access.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Slow work such as thumbnails, cleanup, and email runs through background queues, so the main request stays responsive while the platform takes care of the details.</p>
          </div></div>
        </section>

        <section className="mt-16">
          <div className="flex items-end justify-between gap-4 border-b border-zinc-200 pb-4"><div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Technology</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">The stack underneath CloudShary</h2>
          </div><Mail className="hidden h-5 w-5 text-zinc-400 sm:block" /></div>
          <div className="grid gap-x-8 sm:grid-cols-2">
            {stack.map(([layer, technology]) => <div key={layer} className="flex gap-4 border-b border-zinc-200 py-5"><span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wider text-zinc-400">{layer}</span><span className="text-sm text-zinc-700">{technology}</span></div>)}
          </div>
        </section>
      </main>
    </div>
  );
}