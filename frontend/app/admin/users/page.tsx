"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface AdminUser {
  id: string; email: string; name?: string; role: string;
  verified: boolean; suspended: boolean; createdAt: string; deletedAt: string | null;
  storageUsedBytes: number;
}

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push("/login"); return; }

    Promise.all([apiFetch("/admin/users"), apiFetch("/admin/stats")])
      .then(([usersData, statsData]) => {
        setUsers(usersData.users);
        setStats(statsData);
      })
      .catch((err) => setError(err.message)) // shows "Forbidden" for non-admins
      .finally(() => setLoading(false));
  }, [user, isLoading, router]);

  const toggleSuspend = async (id: string, suspended: boolean) => {
    await apiFetch(`/admin/users/${id}/suspend`, {
      method: "PATCH",
      body: JSON.stringify({ suspended: !suspended }),
    });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, suspended: !suspended } : u)));
  };

  const changeRole = async (id: string, role: string) => {
    const newRole = role === "ADMIN" ? "USER" : "ADMIN";
    await apiFetch(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role: newRole }),
    });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Permanently delete this user's account and data?")) return;
    await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  if (isLoading || loading) return <p className="p-8">Loading...</p>;
  if (error) return <p className="p-8 text-destructive">{error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-6">Admin — Users</h1>

      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-semibold">{stats.userCount}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Total Files</p>
            <p className="text-2xl font-semibold">{stats.fileCount}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Total Storage</p>
            <p className="text-2xl font-semibold">{(stats.totalStorageBytes / 1024 / 1024).toFixed(1)} MB</p>
          </div>
        </div>
      )}

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2">Email</th>
            <th>Role</th>
            <th>Verified</th>
            <th>Storage</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="py-2">{u.email}</td>
              <td>{u.role}</td>
              <td>{u.verified ? "✓" : "—"}</td>
              <td>{(u.storageUsedBytes / 1024 / 1024).toFixed(2)} MB</td>
              <td>{u.deletedAt ? "Deleted" : u.suspended ? "Suspended" : "Active"}</td>
              <td className="flex gap-2 py-2">
                <Button size="sm" variant="outline" onClick={() => changeRole(u.id, u.role)}>
                  {u.role === "ADMIN" ? "Demote" : "Promote"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleSuspend(u.id, u.suspended)}>
                  {u.suspended ? "Unsuspend" : "Suspend"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteUser(u.id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}