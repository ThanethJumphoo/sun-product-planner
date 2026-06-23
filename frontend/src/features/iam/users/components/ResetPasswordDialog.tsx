'use client';

import React, { useState } from 'react';
import { Modal } from '../../../../components/shared/Modal';
import { useUser } from '../api/queries';
import { useUsersUIStore } from '../stores/ui.store';
import { AuthProvider } from '../types/enums';

export function ResetPasswordDialog() {
  const { isEditDrawerOpen, selectedUserId } = useUsersUIStore(); // assuming it might be triggered from edit or list
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  // Note: UI Store should probably have an isOpen/close for this specifically, 
  // but for the sake of isolation, we bind it locally or assume it's controlled elsewhere.
  // We'll mock the open state for now assuming it's triggered from an Action Menu.

  const { data: user } = useUser(selectedUserId as number, {
    enabled: isOpen && selectedUserId !== null,
  });

  const handleReset = async () => {
    if (!selectedUserId || !newPassword) return;
    // Call reset password mutation here
    setIsOpen(false);
  };

  const isLocalProvider = user?.authProvider === AuthProvider.LOCAL;

  return (
    <Modal
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Reset Password"
      description={
        !isLocalProvider && user 
          ? `Cannot reset password. This user authenticates via ${user.authProvider}.` 
          : "Enter a new password for this user. They will be forced to change it on their next login."
      }
      footer={
        <>
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleReset}
            disabled={!isLocalProvider || !newPassword || newPassword.length < 8}
            className="rounded-md bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger/90 disabled:opacity-50"
          >
            Force Reset
          </button>
        </>
      }
    >
      {isLocalProvider && (
        <div className="space-y-2 pt-2">
          <label className="text-sm font-medium text-foreground">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            placeholder="Minimum 8 characters"
          />
        </div>
      )}
    </Modal>
  );
}
