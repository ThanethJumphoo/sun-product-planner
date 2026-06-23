import { apiClient } from '../../../../lib/api-client';
import { handleApiError } from '../../../../utils/api-error';
import { User, UsersPaginatedResponse } from '../types';
import { CreateUserFormValues, UpdateUserFormValues } from '../schemas';
import { ApiResponse } from '../../../../types/api';

export interface GetUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const usersService = {
  async getUsers(query?: GetUsersQuery): Promise<UsersPaginatedResponse> {
    try {
      const { data } = await apiClient.get<UsersPaginatedResponse>('/users', { params: query });
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getUserById(id: number): Promise<User> {
    try {
      const { data } = await apiClient.get<User>(`/users/${id}`);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async createUser(payload: CreateUserFormValues): Promise<User> {
    try {
      const { data } = await apiClient.post<User>('/users', payload);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async updateUser(id: number, payload: UpdateUserFormValues): Promise<User> {
    try {
      const { data } = await apiClient.patch<User>(`/users/${id}`, payload);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async disableUser(id: number): Promise<ApiResponse<{ message: string }>> {
    try {
      const { data } = await apiClient.patch<ApiResponse<{ message: string }>>(`/users/${id}/disable`);
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
