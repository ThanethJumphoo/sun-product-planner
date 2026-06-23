import React, { useMemo } from 'react';
import { Permission } from '../types';

interface PermissionMatrixProps {
  permissions: Permission[];
  selectedPermissionIds: number[];
  onTogglePermission: (permissionId: number) => void;
  readOnly?: boolean;
}

export function PermissionMatrix({
  permissions,
  selectedPermissionIds,
  onTogglePermission,
  readOnly = false,
}: PermissionMatrixProps) {
  // Group permissions by moduleName
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach((p) => {
      if (!groups[p.moduleName]) {
        groups[p.moduleName] = [];
      }
      groups[p.moduleName].push(p);
    });
    return groups;
  }, [permissions]);

  // Extract all unique actions across all modules for columns (e.g. VIEW, CREATE, EDIT, DELETE)
  const allActions = useMemo(() => {
    const actions = new Set<string>();
    permissions.forEach((p) => {
      const action = p.permissionCode.split('.')[1]; // Assumes pattern MODULE.ACTION
      if (action) actions.add(action);
    });
    // Standard sorting for ERP (VIEW usually first, then CREATE, EDIT, DELETE)
    const order = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'APPROVE'];
    return Array.from(actions).sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [permissions]);

  return (
    <div className="w-full overflow-x-auto rounded-md border border-border">
      <table className="w-full text-left text-sm text-foreground">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium border-b border-border">Module</th>
            {allActions.map((action) => (
              <th key={action} className="px-4 py-3 font-medium border-b border-border text-center">
                {action}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {Object.entries(groupedPermissions).map(([moduleName, modulePerms]) => (
            <tr key={moduleName} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 font-medium">{moduleName}</td>
              {allActions.map((action) => {
                const perm = modulePerms.find((p) => p.permissionCode.split('.')[1] === action);
                const isSelected = perm ? selectedPermissionIds.includes(perm.id) : false;

                return (
                  <td key={action} className="px-4 py-3 text-center">
                    {perm ? (
                      <input
                        type="checkbox"
                        disabled={readOnly}
                        checked={isSelected}
                        onChange={() => onTogglePermission(perm.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                      />
                    ) : (
                      <span className="text-muted-foreground/30">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {Object.keys(groupedPermissions).length === 0 && (
            <tr>
              <td colSpan={allActions.length + 1} className="px-4 py-8 text-center text-muted-foreground">
                No permissions available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
