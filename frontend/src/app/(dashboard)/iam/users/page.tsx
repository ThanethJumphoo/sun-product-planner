"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Search, Plus, Edit, UserX, KeyRound, X } from "lucide-react";

interface User {
  id: number;
  username: string;
  roleId: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  role: { id: number; name: string };
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
function UserFormModal({
  user,
  onClose,
}: {
  user?: User | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!user;
  const [form, setForm] = useState({
    username: user?.username || "",
    password: "",
    confirmPassword: "",
    roleId: user?.roleId || 1,
    active: user?.active ?? true,
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!isEdit && form.password !== form.confirmPassword) {
        throw new Error("Passwords do not match");
      }
      if (isEdit) {
        return api.patch(`/api/v1/users/${user.id}`, {
          username: form.username,
          roleId: form.roleId,
          active: form.active,
        });
      }
      return api.post("/api/v1/users", {
        username: form.username,
        password: form.password,
        roleId: form.roleId,
        active: form.active,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: (err: any) => setError(err.response?.data?.message || err.message),
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{isEdit ? "Edit User" : "Create User"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {!isEdit && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Role ID</label>
            <input
              type="number"
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: parseInt(e.target.value) })}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
            />
            <label className="text-sm font-medium">Active</label>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}

          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create User"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [page] = useState(1);
  const [modalUser, setModalUser] = useState<User | null | undefined>(undefined); // undefined = closed

  const { data, isLoading } = useQuery({
    queryKey: ["users", search, page],
    queryFn: () => api.get("/api/v1/users", { params: { search, page, limit: 20 } }).then((r) => r.data),
  });

  const queryClient = useQueryClient();

  const disableMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/api/v1/users/${id}/disable`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const resetPwMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/v1/users/${id}/reset-password`, { newPassword: "P@ssw0rd123!" }),
    onSuccess: () => alert("Password reset to default successfully"),
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage system users, roles, and access</p>
        </div>
        <Button onClick={() => setModalUser(null)}> {/* null = create mode */}
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username..."
              className="w-full h-10 rounded-lg border border-border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Username</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Created</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-28" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : data?.data?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground">No users found</td>
                  </tr>
                ) : (
                  data?.data?.map((user: User) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4 font-medium">{user.username}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                          {user.role?.name || "N/A"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                          user.active
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-600"
                        }`}>
                          {user.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end space-x-1">
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => setModalUser(user)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Reset Password" onClick={() => resetPwMutation.mutate(user.id)}>
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Disable" onClick={() => disableMutation.mutate(user.id)}>
                            <UserX className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Info */}
      {data?.meta && (
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Showing {data.data.length} of {data.meta.total} users</span>
          <span>Page {data.meta.page} / {data.meta.totalPages}</span>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalUser !== undefined && (
          <UserFormModal user={modalUser} onClose={() => setModalUser(undefined)} />
        )}
      </AnimatePresence>
    </div>
  );
}
