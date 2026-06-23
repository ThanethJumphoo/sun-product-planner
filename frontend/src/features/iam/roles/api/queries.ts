import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { rolesService, GetRolesQuery, PaginatedResponse } from './roles.service';
import { Role, Permission } from '../types';

export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (filters: GetRolesQuery) => [...roleKeys.lists(), { filters }] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: number) => [...roleKeys.details(), id] as const,
  users: (id: number) => [...roleKeys.detail(id), 'users'] as const,
};

export function useRoles(query?: GetRolesQuery, options?: Omit<UseQueryOptions<PaginatedResponse<Role>, Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<PaginatedResponse<Role>, Error>({
    queryKey: roleKeys.list(query || {}),
    queryFn: () => rolesService.getRoles(query),
    ...options,
  } as any);
}

export function useRole(id: number, options?: Omit<UseQueryOptions<Role, Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<Role, Error>({
    queryKey: roleKeys.detail(id),
    queryFn: () => rolesService.getRoleById(id),
    enabled: !!id,
    ...options,
  } as any);
}

export function useRoleUsers(id: number, options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<any[], Error>({
    queryKey: roleKeys.users(id),
    queryFn: () => rolesService.getRoleUsers(id),
    enabled: !!id,
    ...options,
  } as any);
}

export function usePermissionsList(options?: Omit<UseQueryOptions<Permission[], Error>, 'queryKey' | 'queryFn'>) {
  return useQuery<Permission[], Error>({
    queryKey: ['permissions', 'list'],
    queryFn: () => rolesService.getAllPermissions(),
    ...options,
  } as any);
}

