"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { GithubStarButton } from "@/components/GithubStarButton";

export function AppHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm hover:underline ${pathname === href ? "font-semibold" : "text-muted-foreground"}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="border-b mb-6">
      <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/dashboard" className="font-semibold">CloudShary</Link>
        <nav className="flex items-center gap-4">
          {navLink("/dashboard", "Dashboard")}
          {navLink("/links", "My Links")}
          {navLink("/settings", "Settings")}
          {user.role === "ADMIN" && navLink("/admin/users", "Admin")}
          <GithubStarButton />
          <Button variant="ghost" size="sm" onClick={logout}>Log out</Button>
        </nav>
      </div>
    </header>
  );
}