"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, Edit, Users, X, Shield } from "lucide-react";

interface Role {
  id: number;
  name: string;
  active: boolean;
  _count?: { users: number };
  permissions: any[];
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
function RoleFormModal({ role, onClose }: { role?: Role | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const isEdit = !!role;
  const [form, setForm] = useState({ name: role?.name || "", active: role?.active ?? true });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) return api.patch(`/api/v1/roles/${role.id}`, form);
      return api.post("/api/v1/roles", form);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["roles"] }); onClose(); },
    onError: (err: any) => setError(err.response?.data?.message || err.message),
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{isEdit ? "Edit Role" : "Create Role"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Role Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex items-center space-x-3">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="w-4 h-4 rounded border-border text-primary" />
            <label className="text-sm font-medium">Active</label>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : isEdit ? "Save" : "Create"}</Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const [modalRole, setModalRole] = useState<Role | null | undefined>(undefined);

  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: () => api.get("/api/v1/roles").then((r) => r.data),
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Define roles and assign permissions</p>
        </div>
        <Button onClick={() => setModalRole(null)}>
          <Plus className="w-4 h-4 mr-2" /> Add Role
        </Button>
      </div>

      {/* Role Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))
          : roles?.map((role) => (
              <Card key={role.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{role.name}</h3>
                        <span className={`text-xs font-medium ${role.active ? "text-green-600" : "text-red-500"}`}>
                          {role.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setModalRole(role)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="mt-4 flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{role._count?.users || 0} users</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="w-4 h-4" />
                      <span>{role.permissions?.length || 0} permissions</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <AnimatePresence>
        {modalRole !== undefined && <RoleFormModal role={modalRole} onClose={() => setModalRole(undefined)} />}
      </AnimatePresence>
    </div>
  );
}
