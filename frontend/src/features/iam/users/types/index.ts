import { UserStatusType, AuthProviderType, ScopeTypeType } from './enums';
import { PaginatedResponse } from '../../../../types/api';

// Base Audit Fields
export interface AuditFields {
  createdAt: string;
  createdBy: number | null;
  updatedAt: string;
  updatedBy: number | null;
  deletedAt: string | null;
  deletedBy: number | null;
}

export interface Permission extends AuditFields {
  id: number;
  permissionCode: string;
  permissionName: string;
  moduleName: string;
  description: string | null;
}

export interface Role extends AuditFields {
  id: number;
  roleName: string;
  description: string | null;
  permissions?: Permission[];
}

export interface UserRoleScope {
  id: number;
  userRoleId: number;
  scopeType: ScopeTypeType;
  scopeValue: string;
}

export interface UserRole {
  id: number;
  userId: number;
  roleId: number;
  role: Role;
  scopes: UserRoleScope[];
}

export interface User extends AuditFields {
  id: number;
  userCode: string;
  username: string;
  status: UserStatusType;
  authProvider: AuthProviderType;
  mfaEnabled: boolean;
  passwordChangedAt: string | null;
  userRoles: UserRole[];
}

export type UsersPaginatedResponse = PaginatedResponse<User>;
