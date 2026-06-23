'use client';

import React, { useMemo } from 'react';
import { Drawer } from '../../../../components/shared/Drawer';
import { UserForm } from './UserForm';
import { useUsersUIStore } from '../stores/ui.store';
import { useUser } from '../api/queries';
import { useUpdateUser } from '../api/mutations';
import { UpdateUserFormValues } from '../schemas';

export function EditUserDrawer() {
  const { isEditDrawerOpen, closeEditDrawer, selectedUserId } = useUsersUIStore();
  const { data: user, isLoading: isFetching } = useUser(selectedUserId as number, {
    enabled: isEditDrawerOpen && selectedUserId !== null,
  });
  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser();

  const defaultValues = useMemo(() => {
    if (!user) return undefined;
    return {
      userCode: user.userCode,
      username: user.username,
      status: user.status,
      authProvider: user.authProvider,
      roles: user.userRoles.map((ur) => ({
        roleId: ur.roleId,
        scopes: ur.scopes.map((s) => ({
          scopeType: s.scopeType,
          scopeValue: s.scopeValue,
        })),
      })),
    };
  }, [user]);

  const handleSubmit = async (data: UpdateUserFormValues) => {
    if (!selectedUserId) return;
    try {
      await updateUser({ id: selectedUserId, data });
      // Show toast success
      closeEditDrawer();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Drawer
      open={isEditDrawerOpen}
      onOpenChange={(open) => !open && closeEditDrawer()}
      title={user ? `Edit User: ${user.userCode}` : 'Edit User'}
      description="Modify user details and role assignments."
      size="md"
      preventClose
    >
      {isFetching ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Loading user data...</p>
        </div>
      ) : defaultValues ? (
        <UserForm
          isEditMode
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={closeEditDrawer}
          isLoading={isUpdating}
        />
      ) : null}
    </Drawer>
  );
}
