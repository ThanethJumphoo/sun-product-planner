'use client';

import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Drawer } from '../../../../components/shared/Drawer';
import { useUsersUIStore } from '../stores/ui.store';
import { useUser } from '../api/queries';
import { UserStatusBadge } from './UserStatusBadge';

export function UserDetailDrawer() {
  const { isDetailDrawerOpen, closeDetailDrawer, selectedUserId } = useUsersUIStore();
  const { data: user, isLoading } = useUser(selectedUserId as number, {
    enabled: isDetailDrawerOpen && selectedUserId !== null,
  });

  return (
    <Drawer
      open={isDetailDrawerOpen}
      onOpenChange={(open) => !open && closeDetailDrawer()}
      title={user ? `User Details: ${user.username}` : 'User Details'}
      size="lg" // Wide drawer for details and history
    >
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Loading details...</p>
        </div>
      ) : user ? (
        <div className="space-y-6">
          <div className="flex items-center space-x-4 border-b border-border pb-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground">{user.username}</h2>
              <p className="text-sm text-muted-foreground">{user.userCode}</p>
            </div>
            <UserStatusBadge status={user.status} />
          </div>

          <Tabs.Root defaultValue="roles" className="flex flex-col">
            <Tabs.List className="flex w-full border-b border-border">
              <Tabs.Trigger
                value="roles"
                className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                Roles & Permissions
              </Tabs.Trigger>
              <Tabs.Trigger
                value="scopes"
                className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                Data Scopes
              </Tabs.Trigger>
              <Tabs.Trigger
                value="sessions"
                className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                Active Sessions
              </Tabs.Trigger>
              <Tabs.Trigger
                value="audit"
                className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
              >
                Audit History
              </Tabs.Trigger>
            </Tabs.List>

            <div className="mt-4">
              <Tabs.Content value="roles" className="space-y-4 outline-none">
                {user.userRoles.map((ur) => (
                  <div key={ur.id} className="rounded-md border border-border p-4">
                    <h4 className="font-medium text-foreground">{ur.role.roleName}</h4>
                    <p className="text-sm text-muted-foreground">{ur.role.description}</p>
                  </div>
                ))}
              </Tabs.Content>
              <Tabs.Content value="scopes" className="space-y-4 outline-none">
                {user.userRoles.map((ur) => (
                  <div key={ur.id} className="rounded-md border border-border p-4">
                    <h4 className="font-medium text-foreground">Scopes for {ur.role.roleName}</h4>
                    <ul className="mt-2 list-inside list-disc text-sm">
                      {ur.scopes.map((s) => (
                        <li key={s.id}>{s.scopeType}: <span className="font-medium">{s.scopeValue}</span></li>
                      ))}
                      {ur.scopes.length === 0 && <span className="text-muted-foreground italic">Global Access</span>}
                    </ul>
                  </div>
                ))}
              </Tabs.Content>
              <Tabs.Content value="sessions" className="outline-none">

                <p className="text-sm text-muted-foreground italic">Session management integration pending...</p>
              </Tabs.Content>
              <Tabs.Content value="audit" className="outline-none">
                <p className="text-sm text-muted-foreground italic">Audit events integration pending...</p>
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center">
          <p className="text-danger">Failed to load user.</p>
        </div>
      )}
    </Drawer>
  );
}
