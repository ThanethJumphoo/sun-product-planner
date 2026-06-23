'use client';

import React from 'react';
import { Drawer } from '../../../../components/shared/Drawer';
import { UserForm } from './UserForm';
import { useUsersUIStore } from '../stores/ui.store';
import { useCreateUser } from '../api/mutations';
import { CreateUserFormValues } from '../schemas';

export function CreateUserDrawer() {
  const { isCreateDrawerOpen, closeCreateDrawer } = useUsersUIStore();
  const { mutateAsync: createUser, isPending } = useCreateUser();

  const handleSubmit = async (data: CreateUserFormValues) => {
    try {
      await createUser(data);
      // Show toast success here
      closeCreateDrawer();
    } catch (error) {
      // Handle error (form errors or toast)
      console.error(error);
    }
  };

  return (
    <Drawer
      open={isCreateDrawerOpen}
      onOpenChange={(open) => !open && closeCreateDrawer()}
      title="Create New User"
      description="Add a new user to the system. You must assign at least one role."
      size="md"
      preventClose // Requires confirmation if form is dirty
    >
      <UserForm
        onSubmit={handleSubmit}
        onCancel={closeCreateDrawer}
        isLoading={isPending}
      />
    </Drawer>
  );
}
