import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRoleSchema, CreateRoleFormValues } from '../schemas';
import { RoleStatus } from '../types/enums';
import { PermissionMatrix } from '../components/PermissionMatrix';
import { ScopeTemplateEditor } from '../components/ScopeTemplateEditor';
import { usePermissionsList } from '../api/queries';

interface RoleFormProps {
  initialValues?: Partial<CreateRoleFormValues>;
  onSubmit: (values: CreateRoleFormValues) => void;
  isLoading?: boolean;
  isEdit?: boolean;
  readOnly?: boolean;
}

export function RoleForm({
  initialValues,
  onSubmit,
  isLoading,
  isEdit,
  readOnly,
}: RoleFormProps) {
  const { data: permissions = [] } = usePermissionsList();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      roleCode: '',
      roleName: '',
      description: '',
      status: RoleStatus.ACTIVE,
      isSystemRole: false,
      permissions: [],
      roleScopes: [],
      ...initialValues,
    },
  });

  const isSystemRole = watch('isSystemRole');
  const selectedPermissionIds: number[] = watch('permissions') || [];

  const handleTogglePermission = (permissionId: number) => {
    if (readOnly) return;
    if (selectedPermissionIds.includes(permissionId)) {
      setValue('permissions', selectedPermissionIds.filter((id: number) => id !== permissionId), { shouldDirty: true });
    } else {
      setValue('permissions', [...selectedPermissionIds, permissionId], { shouldDirty: true });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Section 1: Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Information</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground">Role Code *</label>
            <input
              {...register('roleCode')}
              disabled={isEdit || readOnly}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
              placeholder="e.g. PRODUCTION_PLANNER"
            />
            {errors.roleCode && <p className="mt-1 text-sm text-danger">{errors.roleCode.message as string}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Role Name *</label>
            <input
              {...register('roleName')}
              disabled={readOnly}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
            />
            {errors.roleName && <p className="mt-1 text-sm text-danger">{errors.roleName.message as string}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground">Description</label>
            <textarea
              {...register('description')}
              disabled={readOnly}
              rows={3}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
            />
          </div>
          {!isSystemRole && (
            <div>
              <label className="block text-sm font-medium text-foreground">Status</label>
              <select
                {...register('status')}
                disabled={readOnly}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value={RoleStatus.ACTIVE}>Active</option>
                <option value={RoleStatus.INACTIVE}>Inactive</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Permission Matrix */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Permissions Matrix</h3>
        <PermissionMatrix
          permissions={permissions}
          selectedPermissionIds={selectedPermissionIds}
          onTogglePermission={handleTogglePermission}
          readOnly={readOnly}
        />
        {errors.permissions && <p className="mt-1 text-sm text-danger">{errors.permissions.message as string}</p>}
      </div>

      {/* Section 3: Scope Templates */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Default Scope Templates</h3>
        <p className="text-sm text-muted-foreground">
          Define default data scopes that will be automatically assigned to users when they receive this role.
        </p>
        <Controller
          control={control}
          name="roleScopes"
          render={({ field }) => (
            <ScopeTemplateEditor
              scopes={field.value}
              onChange={field.onChange}
              readOnly={readOnly}
            />
          )}
        />
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="flex justify-end space-x-3 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Saving...' : isEdit ? 'Update Role' : 'Create Role'}
          </button>
        </div>
      )}
    </form>
  );
}
