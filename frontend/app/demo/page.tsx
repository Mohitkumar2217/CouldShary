import Link from "next/link";
import { ArrowDown, ArrowRight, Check, Database, FileCheck2, FolderOpen, HardDrive, LockKeyhole, Mail, Server, Share2, Upload, Workflow } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";

const workflow = [
  { number: "01", icon: Upload, title: "Upload", text: "The browser splits large files into resumable chunks and reports progress." },
  { number: "02", icon: Server, title: "Process", text: "The API authenticates the request, validates ownership, and finalizes the upload." },
  { number: "03", icon: HardDrive, title: "Store", text: "File bytes live in Supabase Storage while PostgreSQL stores searchable metadata." },
  { number: "04", icon: Share2, title: "Share", text: "A secure link can add a password, expiration, download limit, or named permissions." },
  { number: "05", icon: LockKeyhole, title: "Access", text: "Every request is checked before a short-lived signed URL is issued for the file." },
];

const tools = [
  { icon: Workflow, title: "Next.js + React", text: "App Router pages and a responsive dashboard UI." },
  { icon: Server, title: "Express + TypeScript", text: "A typed API with auth, ownership, and role checks." },
  { icon: Database, title: "PostgreSQL + Prisma", text: "Users, folders, files, links, and permissions." },
  { icon: HardDrive, title: "Supabase Storage", text: "Durable object storage for the actual file bytes." },
  { icon: FileCheck2, title: "Redis + BullMQ", text: "Queues for thumbnails, email, and cleanup jobs." },
  { icon: Mail, title: "Resend", text: "Verification, reset, and sharing notifications." },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <section className="relative overflow-hidden border border-zinc-200 bg-white px-6 py-10 sm:px-10 sm:py-14">
          <div className="absolute right-0 top-0 h-40 w-40 translate-x-1/3 -translate-y-1/3 rounded-full border-[24px] border-zinc-100" />
          <div className="relative max-w-3xl"><p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">CloudShary / Demo</p><h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">The whole journey of a file.</h1><p className="mt-6 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">Follow one file from a user&apos;s browser to protected storage, then back out through a controlled share link.</p></div>
        </section>

        <section className="mt-12"><div className="mb-6 flex items-end justify-between border-b border-zinc-200 pb-4"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">A to Z workflow</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">What happens after you click upload?</h2></div><ArrowDown className="hidden h-5 w-5 text-zinc-400 sm:block" /></div>
          <div className="grid gap-3 lg:grid-cols-5">{workflow.map(({ number, icon: Icon, title, text }, index) => <div key={number} className="relative border border-zinc-200 bg-white p-5"><div className="flex items-center justify-between"><span className="font-mono text-xs text-zinc-400">{number}</span><Icon className="h-5 w-5 text-zinc-800" /></div><h3 className="mt-10 text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-600">{text}</p>{index < workflow.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 bg-zinc-50 text-zinc-400 lg:block" />}</div>)}</div>
        </section>

        <section className="mt-16 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Behind the screen</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Six tools, one clear experience.</h2><p className="mt-4 text-sm leading-6 text-zinc-600">Each service has one job. Together they keep the interface simple while the platform handles storage, security, and slow background work reliably.</p><Link href="/docs" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-zinc-950 hover:underline">Read the essentials <ArrowRight className="h-4 w-4" /></Link></div>
          <div className="grid gap-px border border-zinc-200 bg-zinc-200 sm:grid-cols-2">{tools.map(({ icon: Icon, title, text }) => <div key={title} className="bg-white p-5"><Icon className="h-5 w-5 text-zinc-800" /><h3 className="mt-5 text-sm font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-600">{text}</p></div>)}</div>
        </section>

        <section className="mt-16 border-y border-zinc-200 py-10"><div className="grid gap-8 lg:grid-cols-3"><div className="flex gap-4"><FolderOpen className="h-5 w-5 shrink-0 text-zinc-700" /><div><h3 className="text-sm font-semibold">Organize</h3><p className="mt-1 text-sm leading-6 text-zinc-600">Nested folders and metadata keep the library usable as it grows.</p></div></div><div className="flex gap-4"><LockKeyhole className="h-5 w-5 shrink-0 text-zinc-700" /><div><h3 className="text-sm font-semibold">Protect</h3><p className="mt-1 text-sm leading-6 text-zinc-600">Passwords are hashed and resource access is checked server-side.</p></div></div><div className="flex gap-4"><Check className="h-5 w-5 shrink-0 text-zinc-700" /><div><h3 className="text-sm font-semibold">Finish cleanly</h3><p className="mt-1 text-sm leading-6 text-zinc-600">Queues handle thumbnails, email, expired links, and cleanup away from the request.</p></div></div></div></section>
      </main>
    </div>
  );
}