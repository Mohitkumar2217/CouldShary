"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { GithubStarButton } from "@/components/GithubStarButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User, Settings, LogOut } from "lucide-react";

export function AppHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;

  const navLink = (href: string, label: string) => {
    const isActive =
      pathname === href ||
      (href !== "/dashboard" && pathname.startsWith(href));

    return (
      <Link href={href} className={` rounded-md px-3 py-1.5 text-sm transition-colors ${isActive ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-900 hover:text-white"}`}>
        {label}
      </Link>
    );
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="w-full border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m7 10 5 5 5-5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 21h14" />
            </svg>
          </div>

          <span className="text-sm font-semibold tracking-tight text-zinc-950">
            CloudShary
          </span>
        </Link>

        <nav className="hidden gap-1 sm:flex">
          {navLink("/dashboard", "Dashboard")}
          {navLink("/links", "Links")} 
          {user.role === "ADMIN" && navLink("/admin/users", "Admin")}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <GithubStarButton />
          </div>
          <div className="mx-1 hidden h-5 w-px bg-zinc-200 sm:block" />
          <Dialog>
            <DialogTrigger
              render={
                <Button variant="ghost" size="icon" className=" h-9 w-9 rounded-full border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-950 hover:text-white" />
              }
            >
              <User className="h-4 w-4" />
            </DialogTrigger>

            <DialogContent className="sm:max-w-sm border-zinc-200 bg-white">
              <DialogHeader>
                <DialogTitle className="text-zinc-950">
                  Account
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white">
                    <User className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-950">
                      {user.email}
                    </p>

                    <p className="text-xs text-zinc-500">
                      {user.role}
                    </p>
                  </div>
                </div>

                <Button variant="outline" className="w-full justify-start border-zinc-200 text-zinc-900 hover:bg-zinc-950 hover:text-white" onClick={() => router.push("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Profile & Settings
                </Button>

                <Button variant="outline" className="w-full justify-start border-zinc-200 text-zinc-900 hover:bg-zinc-950 hover:text-white" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <nav
        className=" flex gap-1 overflow-x-auto border-t border-zinc-200 px-4 py-2 sm:hidden">
        {navLink("/dashboard", "Dashboard")}
        {navLink("/links", "My Links")}
        {navLink("/settings", "Settings")}
        {user.role === "ADMIN" && navLink("/admin/users", "Admin")}
      </nav>
    </header>
  );
}