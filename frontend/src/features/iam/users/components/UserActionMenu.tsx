'use client';

import React, { useMemo } from 'react';
import { ActionMenu, ActionMenuItem } from '../../../../components/shared/ActionMenu';
import { User } from '../types';
import { UserStatus } from '../types/enums';
import { Eye, Edit, KeyRound, Ban, CheckCircle2 } from 'lucide-react';
import { useUsersUIStore } from '../stores/ui.store';
import { useDisableUser } from '../api/mutations';

export interface UserActionMenuProps {
  user: User;
}

export function UserActionMenu({ user }: UserActionMenuProps) {
  const { openDetailDrawer, openEditDrawer } = useUsersUIStore();
  const { mutate: disableUser } = useDisableUser();

  const actions = useMemo<ActionMenuItem<User>[]>(() => [
    {
      id: 'view',
      label: 'View Details',
      icon: <Eye />,
      permission: 'USER.VIEW',
      onClick: (u) => openDetailDrawer(u.id),
    },
    {
      id: 'edit',
      label: 'Edit User',
      icon: <Edit />,
      permission: 'USER.EDIT',
      onClick: (u) => openEditDrawer(u.id),
      disabled: (u) => u.status === UserStatus.LOCKED,
    },
    {
      id: 'reset-password',
      label: 'Reset Password',
      icon: <KeyRound />,
      permission: 'USER.EDIT',
      divider: true,
      onClick: (u) => {
        // Handle reset password dialog
        console.log('Open reset password for:', u.id);
      },
    },
    {
      id: 'status-action',
      label: user.status === UserStatus.LOCKED ? 'Unlock User' 
           : user.status === UserStatus.PENDING ? 'Activate User'
           : user.status === UserStatus.SUSPENDED ? 'Restore User'
           : 'Suspend User',
      icon: user.status === UserStatus.ACTIVE ? <Ban /> : <CheckCircle2 />,
      permission: 'USER.EDIT',
      danger: user.status === UserStatus.ACTIVE,
      onClick: (u) => {
        const actionName = u.status === UserStatus.ACTIVE ? 'suspend' : 'activate';
        if (confirm(`Are you sure you want to ${actionName} this user?`)) {
          disableUser(u.id); // Assuming disableUser API handles the toggle backend-side
        }
      },
    },
  ], [openDetailDrawer, openEditDrawer, disableUser, user.status]);

  return <ActionMenu data={user} actions={actions} />;
}

