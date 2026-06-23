import { User } from '../../users/types';
import { RoleStatusType } from './enums';

export interface RoleScope {
  id: number;
  roleId: number;
  scopeType: string;
  scopeValue: string;
}

export interface Permission {
  id: number;
  permissionCode: string;
  permissionName: string;
  moduleName: string;
  description?: string;
}

export interface RolePermission {
  roleId: number;
  permissionId: number;
  permission: Permission;
}

export interface Role {
  id: number;
  roleCode: string;
  roleName: string;
  description?: string;
  status: RoleStatusType;
  isSystemRole: boolean;
  
  permissions: RolePermission[];
  roleScopes: RoleScope[];
  
  usersCount?: number; // Aggregated from API
  permissionsCount?: number; // Aggregated from API

  createdAt: string;
  createdBy?: number;
  updatedAt: string;
  updatedBy?: number;
}
