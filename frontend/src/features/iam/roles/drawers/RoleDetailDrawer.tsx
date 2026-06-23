import React, { useState } from 'react';
import { Drawer } from '../../../../components/shared/Drawer';
import { useRolesUIStore } from '../stores/ui.store';
import { useRole, useRoleUsers } from '../api/queries';
import { RoleForm } from '../forms/RoleForm';
import { RoleStatusBadge } from '../components/RoleStatusBadge';
import { format } from 'date-fns';

type TabType = 'info' | 'permissions' | 'scopes' | 'users' | 'audit';

export function RoleDetailDrawer() {
  const { isDetailDrawerOpen, closeDetailDrawer, selectedRoleId } = useRolesUIStore();
  const [activeTab, setActiveTab] = useState<TabType>('info');

  const { data: role, isLoading } = useRole(selectedRoleId!, {
    enabled: isDetailDrawerOpen && !!selectedRoleId,
  });

  const { data: users = [], isLoading: isLoadingUsers } = useRoleUsers(selectedRoleId!, {
    enabled: isDetailDrawerOpen && !!selectedRoleId && activeTab === 'users',
  });

  return (
    <Drawer
      open={isDetailDrawerOpen}
      onClose={closeDetailDrawer}
      title={
        <div className="flex items-center space-x-3">
          <span>Role Details</span>
          {role && <RoleStatusBadge status={role.status} />}
          {role?.isSystemRole && (
            <span className="rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              System Role
            </span>
          )}
        </div>
      }
      size="lg"
    >
      <div className="flex h-full flex-col">
        {/* Tabs */}
        <div className="border-b border-border px-6 pt-4">
          <nav className="-mb-px flex space-x-6">
            {(
              [
                { id: 'info', label: 'Information' },
                { id: 'permissions', label: 'Permissions' },
                { id: 'scopes', label: 'Scope Templates' },
                { id: 'users', label: 'Assigned Users' },
                { id: 'audit', label: 'Audit' },
              ] as { id: TabType; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              Loading role details...
            </div>
          ) : !role ? (
            <div className="text-danger">Failed to load role details.</div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'info' && (
                <div className="grid grid-cols-2 gap-6 rounded-lg border border-border bg-surface p-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Role Code</h4>
                    <p className="mt-1 text-base text-foreground font-mono">{role.roleCode}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Role Name</h4>
                    <p className="mt-1 text-base text-foreground">{role.roleName}</p>
                  </div>
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                    <p className="mt-1 text-base text-foreground">{role.description || '-'}</p>
                  </div>
                </div>
              )}

              {/* Render Read-Only Form for Matrix and Scopes to reuse the beautiful UI components */}
              {activeTab === 'permissions' && (
                <RoleForm
                  readOnly
                  initialValues={{
                    permissions: role.permissions?.map((p) => p.permissionId) || [],
                    roleScopes: [],
                  }}
                  onSubmit={() => {}}
                />
              )}

              {activeTab === 'scopes' && (
                <RoleForm
                  readOnly
                  initialValues={{
                    permissions: [],
                    roleScopes: role.roleScopes || [],
                  }}
                  onSubmit={() => {}}
                />
              )}

              {activeTab === 'users' && (
                <div className="rounded-lg border border-border bg-surface overflow-hidden">
                  {isLoadingUsers ? (
                    <div className="p-8 text-center text-muted-foreground">Loading users...</div>
                  ) : users.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No users assigned to this role.</div>
                  ) : (
                    <table className="w-full text-left text-sm text-foreground">
                      <thead className="bg-muted text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium border-b border-border">User Code</th>
                          <th className="px-4 py-3 font-medium border-b border-border">Username</th>
                          <th className="px-4 py-3 font-medium border-b border-border">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {users.map((u: any) => (
                          <tr key={u.id} className="hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium text-primary">{u.user?.userCode || '-'}</td>
                            <td className="px-4 py-3">{u.user?.username || '-'}</td>
                            <td className="px-4 py-3">{u.user?.status || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="grid grid-cols-2 gap-6 rounded-lg border border-border bg-surface p-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Created At</h4>
                    <p className="mt-1 text-base text-foreground">
                      {role.createdAt ? format(new Date(role.createdAt), 'dd MMM yyyy HH:mm:ss') : '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Updated At</h4>
                    <p className="mt-1 text-base text-foreground">
                      {role.updatedAt ? format(new Date(role.updatedAt), 'dd MMM yyyy HH:mm:ss') : '-'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
