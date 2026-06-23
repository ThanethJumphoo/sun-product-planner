import { apiClient } from '../../../../lib/api-client';
import { Role, Permission } from '../types';

export interface GetRolesQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const rolesService = {
  getRoles: async (query?: GetRolesQuery): Promise<PaginatedResponse<Role>> => {
    const response = await apiClient.get<PaginatedResponse<Role>>('/roles', { params: query });
    return response.data;
  },

  getRoleById: async (id: number): Promise<Role> => {
    const response = await apiClient.get<Role>(`/roles/${id}`);
    return response.data;
  },

  getRoleUsers: async (id: number): Promise<any[]> => {
    const response = await apiClient.get<any[]>(`/roles/${id}/users`);
    return response.data;
  },

  getAllPermissions: async (): Promise<Permission[]> => {
    const response = await apiClient.get<Permission[]>('/permissions');
    return response.data;
  },

  createRole: async (data: any): Promise<Role> => {
    const response = await apiClient.post<Role>('/roles', data);
    return response.data;
  },

  updateRole: async (id: number, data: any): Promise<Role> => {
    const response = await apiClient.put<Role>(`/roles/${id}`, data);
    return response.data;
  },

  updateRoleStatus: async (id: number, status: string): Promise<Role> => {
    const response = await apiClient.patch<Role>(`/roles/${id}/status`, { status });
    return response.data;
  },

  deleteRole: async (id: number): Promise<void> => {
    await apiClient.delete(`/roles/${id}`);
  },
};
