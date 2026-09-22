'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserSchema } from '../schemas';
import { UserStatus, AuthProvider } from '../types/enums';

import { useRoles } from '../../roles/api/queries';

export interface UserFormProps {
  defaultValues?: Partial<z.infer<typeof createUserSchema>>;
  onSubmit: (data: any) => void;
  isEditMode?: boolean;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function UserForm({ defaultValues, onSubmit, isEditMode, onCancel, isLoading }: UserFormProps) {
  // Using createUserSchema as base, making password optional if in edit mode
  const schema = isEditMode 
    ? createUserSchema.extend({ password: z.string().optional() }) 
    : createUserSchema;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {
      status: UserStatus.ACTIVE,
      authProvider: AuthProvider.LOCAL,
      roles: [],
    },
  });

  const { data: rolesData, isLoading: isLoadingRoles } = useRoles();
  const availableRoles = rolesData?.data || [];

  return (
    <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">User Code</label>
          <input
            {...register('userCode')}
            disabled={isEditMode}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm disabled:bg-muted"
            placeholder="e.g. USR-001"
          />
          {errors.userCode && <p className="text-xs text-danger">{errors.userCode.message?.toString()}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Username</label>
          <input
            {...register('username')}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            placeholder="John Doe"
          />
          {errors.username && <p className="text-xs text-danger">{errors.username.message?.toString()}</p>}
        </div>

        {!isEditMode && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            />
            {errors.password && <p className="text-xs text-danger">{errors.password.message?.toString()}</p>}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Auth Provider</label>
          <select
            {...register('authProvider')}
            disabled={isEditMode} // Cannot change provider after creation
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm disabled:bg-muted"
          >
            {Object.values(AuthProvider).map((provider) => (
              <option key={provider} value={provider}>{provider}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Status</label>
          <select
            {...register('status')}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          >
            {Object.values(UserStatus).map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="text-section font-semibold text-foreground">Roles & Scopes</h3>
        <p className="text-sm text-muted-foreground">Assign roles and their business scopes to this user.</p>
        
        {/* Simplified Multi-role Checkboxes for demonstration */}
        <Controller
          name="roles"
          control={control}
          render={({ field }) => (
            <div className="space-y-3">
              {availableRoles.map((role) => {
                const isSelected = field.value?.some((r: any) => r.roleId === role.id);
                return (
                  <div key={role.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`role-${role.id}`}
                      checked={isSelected}
                      onChange={(e) => {
                        const current = field.value || [];
                        if (e.target.checked) {
                          // Note: Scopes would be managed by a more complex sub-component in reality
                          field.onChange([...current, { roleId: role.id, scopes: [] }]);
                        } else {
                          field.onChange(current.filter((r: any) => r.roleId !== role.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor={`role-${role.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {role.roleName}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        />
        {errors.roles && <p className="text-xs text-danger">{errors.roles.message?.toString()}</p>}
      </div>

      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : isEditMode ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
}
