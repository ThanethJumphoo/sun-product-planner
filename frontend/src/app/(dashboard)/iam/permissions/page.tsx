"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Save, Check } from "lucide-react";

interface PermissionMatrix {
  applicationId: number;
  applicationName: string;
  permissions: { id: number; action: string }[];
}

interface Role {
  id: number;
  name: string;
  permissions: { permissionId: number }[];
}

export default function PermissionsPage() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [checkedPermissions, setCheckedPermissions] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState(false);

  // Fetch matrix
  const { data: matrix, isLoading: matrixLoading } = useQuery<PermissionMatrix[]>({
    queryKey: ["permission-matrix"],
    queryFn: () => api.get("/api/v1/permissions/matrix").then((r) => r.data),
  });

  // Fetch roles
  const { data: roles } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: () => api.get("/api/v1/roles").then((r) => r.data),
  });

  // When a role is selected, load its current permissions
  const handleSelectRole = (roleId: number) => {
    setSelectedRoleId(roleId);
    const role = roles?.find((r) => r.id === roleId);
    if (role) {
      setCheckedPermissions(new Set(role.permissions.map((p: any) => p.permissionId)));
    }
    setSaved(false);
  };

  const togglePermission = (permId: number) => {
    setCheckedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
    setSaved(false);
  };

  // Save
  const saveMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/v1/roles/${selectedRoleId}/permissions`, {
        permissionIds: Array.from(checkedPermissions),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Permission Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Assign permissions to roles using the matrix below
        </p>
      </div>

      {/* Role Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium whitespace-nowrap">Select Role:</label>
            <select
              value={selectedRoleId || ""}
              onChange={(e) => handleSelectRole(parseInt(e.target.value))}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 flex-1 max-w-xs"
            >
              <option value="">Choose a role...</option>
              {roles?.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            {selectedRoleId && (
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saved ? (
                  <><Check className="w-4 h-4 mr-2 text-green-500" /> Saved!</>
                ) : saveMutation.isPending ? (
                  "Saving..."
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save Permissions</>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      {!selectedRoleId ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            Select a role above to manage its permissions
          </CardContent>
        </Card>
      ) : matrixLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground w-56">Application</th>
                    {/* Collect unique actions across all apps */}
                    {Array.from(new Set(matrix?.flatMap((app) => app.permissions.map((p) => p.action)) || []))
                      .sort()
                      .map((action) => (
                        <th key={action} className="text-center p-4 font-medium text-muted-foreground">{action}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix?.map((app, i) => {
                    const allActions = Array.from(new Set(matrix.flatMap((a) => a.permissions.map((p) => p.action)))).sort();
                    return (
                      <motion.tr
                        key={app.applicationId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4 font-medium">{app.applicationName}</td>
                        {allActions.map((action) => {
                          const perm = app.permissions.find((p) => p.action === action);
                          if (!perm) return <td key={action} className="text-center p-4"><span className="text-muted-foreground/30">—</span></td>;
                          return (
                            <td key={action} className="text-center p-4">
                              <input
                                type="checkbox"
                                checked={checkedPermissions.has(perm.id)}
                                onChange={() => togglePermission(perm.id)}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50 cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
