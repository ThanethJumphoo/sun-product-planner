import React from 'react';
import { Drawer } from '../../../../components/shared/Drawer';
import { useRolesUIStore } from '../stores/ui.store';
import { RoleForm } from '../forms/RoleForm';
import { useRole } from '../api/queries';
import { useUpdateRole } from '../api/mutations';
import { CreateRoleFormValues } from '../schemas';

export function EditRoleDrawer() {
  const { isEditDrawerOpen, closeEditDrawer, selectedRoleId } = useRolesUIStore();
  
  const { data: role, isLoading: isFetching } = useRole(selectedRoleId!, {
    enabled: isEditDrawerOpen && !!selectedRoleId,
  });
  
  const { mutate: updateRole, isPending } = useUpdateRole();

  const handleSubmit = (values: CreateRoleFormValues) => {
    if (!selectedRoleId) return;
    updateRole(
      { id: selectedRoleId, data: values },
      {
        onSuccess: () => {
          closeEditDrawer();
        },
      }
    );
  };

  return (
    <Drawer
      open={isEditDrawerOpen}
      onClose={closeEditDrawer}
      title="Edit Role"
      size="lg"
    >
      <div className="p-6">
        {isFetching ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : role ? (
          <RoleForm
            isEdit
            initialValues={{
              roleCode: role.roleCode,
              roleName: role.roleName,
              description: role.description || '',
              status: role.status,
              isSystemRole: role.isSystemRole,
              permissions: role.permissions?.map((p) => p.permissionId) || [],
              roleScopes: role.roleScopes || [],
            }}
            onSubmit={handleSubmit}
            isLoading={isPending}
          />
        ) : (
          <div className="text-danger">Failed to load role details.</div>
        )}
      </div>
    </Drawer>
  );
}
