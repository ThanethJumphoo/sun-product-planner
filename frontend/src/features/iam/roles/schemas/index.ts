import { z } from 'zod';
import { RoleStatus } from '../types/enums';

export const createRoleSchema = z.object({
  roleCode: z.string().min(2, 'Role Code is required'),
  roleName: z.string().min(2, 'Role Name is required'),
  description: z.string().optional(),
  status: z.nativeEnum(RoleStatus),
  isSystemRole: z.boolean(),
  permissions: z.array(z.number()),
  roleScopes: z.array(z.object({
    scopeType: z.string(),
    scopeValue: z.string(),
  })),
});

export type CreateRoleFormValues = z.infer<typeof createRoleSchema>;
export type UpdateRoleFormValues = Partial<CreateRoleFormValues>;
