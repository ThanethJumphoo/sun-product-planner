import React from 'react';
import { Drawer } from '../../../../components/shared/Drawer';
import { useRolesUIStore } from '../stores/ui.store';
import { RoleForm } from '../forms/RoleForm';
import { useCreateRole } from '../api/mutations';
import { CreateRoleFormValues } from '../schemas';

export function CreateRoleDrawer() {
  const { isCreateDrawerOpen, closeCreateDrawer } = useRolesUIStore();
  const { mutate: createRole, isPending } = useCreateRole();

  const handleSubmit = (values: CreateRoleFormValues) => {
    createRole(values, {
      onSuccess: () => {
        closeCreateDrawer();
      },
    });
  };

  return (
    <Drawer
      open={isCreateDrawerOpen}
      onClose={closeCreateDrawer}
      title="Create New Role"
      size="lg"
    >
      <div className="p-6">
        <RoleForm onSubmit={handleSubmit} isLoading={isPending} />
      </div>
    </Drawer>
  );
}
