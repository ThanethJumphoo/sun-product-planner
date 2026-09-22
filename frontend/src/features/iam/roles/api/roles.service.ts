import api from '@/lib/api';
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
    const response = await api.get<PaginatedResponse<Role>>('/api/v1/roles', { params: query });
    return response.data;
  },

  getRoleById: async (id: number): Promise<Role> => {
    const response = await api.get<Role>(`/api/v1/roles/${id}`);
    return response.data;
  },

  getRoleUsers: async (id: number): Promise<any[]> => {
    const response = await api.get<any[]>(`/api/v1/roles/${id}/users`);
    return response.data;
  },

  getAllPermissions: async (): Promise<Permission[]> => {
    const response = await api.get<Permission[]>('/api/v1/permissions');
    return response.data;
  },

  createRole: async (data: any): Promise<Role> => {
    const response = await api.post<Role>('/api/v1/roles', data);
    return response.data;
  },

  updateRole: async (id: number, data: any): Promise<Role> => {
    const response = await api.put<Role>(`/api/v1/roles/${id}`, data);
    return response.data;
  },

  updateRoleStatus: async (id: number, status: string): Promise<Role> => {
    const response = await api.patch<Role>(`/api/v1/roles/${id}/status`, { status });
    return response.data;
  },

  deleteRole: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/roles/${id}`);
  },
};
