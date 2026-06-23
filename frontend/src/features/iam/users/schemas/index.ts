import { z } from 'zod';
import { UserStatus, AuthProvider, ScopeType } from '../types/enums';

const statusEnum = z.nativeEnum(UserStatus);
const authProviderEnum = z.nativeEnum(AuthProvider);
const scopeTypeEnum = z.nativeEnum(ScopeType);

export const userRoleScopeSchema = z.object({
  scopeType: scopeTypeEnum,
  scopeValue: z.string().min(1, 'Scope value is required'),
});

export const userRoleSchema = z.object({
  roleId: z.number().int().positive('Role must be selected'),
  scopes: z.array(userRoleScopeSchema),
});

export const createUserSchema = z.object({
  userCode: z.string().min(3, 'User code must be at least 3 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  status: statusEnum.default(UserStatus.ACTIVE),
  authProvider: authProviderEnum.default(AuthProvider.LOCAL),
  roles: z.array(userRoleSchema).min(1, 'At least one role is required'),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.partial().extend({
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
