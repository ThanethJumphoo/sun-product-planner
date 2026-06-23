import React, { useMemo } from 'react';
import { Edit, CheckCircle2, Ban, Copy, Users } from 'lucide-react';
import { ActionMenu, ActionMenuItem } from '../../../../components/shared/ActionMenu';
import { Role } from '../types';
import { useRolesUIStore } from '../stores/ui.store';
import { useDeleteRole } from '../api/mutations';
import { RoleStatus } from '../types/enums';

interface RoleActionMenuProps {
  role: Role;
}

export function RoleActionMenu({ role }: RoleActionMenuProps) {
  const { openEditDrawer, openDetailDrawer } = useRolesUIStore();
  const { mutate: deleteRole } = useDeleteRole();

  const actions = useMemo<ActionMenuItem<Role>[]>(() => [
    {
      id: 'view',
      label: 'View Details',
      icon: <Users />, // Can map to a better icon if needed
      permission: 'ROLE.VIEW',
      onClick: (r) => openDetailDrawer(r.id),
    },
    {
      id: 'edit',
      label: 'Edit Role',
      icon: <Edit />,
      permission: 'ROLE.EDIT',
      onClick: (r) => openEditDrawer(r.id),
    },
    {
      id: 'duplicate',
      label: 'Duplicate Role',
      icon: <Copy />,
      permission: 'ROLE.CREATE',
      divider: true,
      onClick: (r) => {
        console.log('Duplicate role:', r.id);
        // Dispatch to duplicate workflow
      },
    },
    {
      id: 'status-action',
      label: role.status === RoleStatus.ACTIVE ? 'Deactivate Role' : 'Activate Role',
      icon: role.status === RoleStatus.ACTIVE ? <Ban /> : <CheckCircle2 />,
      permission: 'ROLE.EDIT',
      danger: role.status === RoleStatus.ACTIVE,
      disabled: role.isSystemRole,
      onClick: (r) => {
        if (r.isSystemRole) {
          alert('System roles cannot be deactivated.');
          return;
        }
        if (confirm(`Are you sure you want to ${r.status === RoleStatus.ACTIVE ? 'deactivate' : 'activate'} this role?`)) {
          deleteRole(r.id); // Assuming this is wired to a soft-delete/deactivate mechanism
        }
      },
    },
  ], [openDetailDrawer, openEditDrawer, deleteRole, role.status, role.isSystemRole]);

  return <ActionMenu data={role} actions={actions} />;
}
