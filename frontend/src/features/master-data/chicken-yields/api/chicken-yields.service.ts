import { apiClient } from '../../../../lib/api-client';
import { ChickenYield } from '../types';

export interface GetChickenYieldsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const chickenYieldsService = {
  getChickenYields: async (query?: GetChickenYieldsQuery): Promise<PaginatedResponse<ChickenYield>> => {
    const response = await apiClient.get<PaginatedResponse<ChickenYield>>('/master-data/chicken-yields', { params: query });
    return response.data;
  },

  getChickenYieldById: async (id: number): Promise<ChickenYield> => {
    const response = await apiClient.get<ChickenYield>(`/master-data/chicken-yields/${id}`);
    return response.data;
  },

  createChickenYield: async (data: any): Promise<ChickenYield> => {
    const response = await apiClient.post<ChickenYield>('/master-data/chicken-yields', data);
    return response.data;
  },

  updateChickenYield: async (id: number, data: any): Promise<ChickenYield> => {
    const response = await apiClient.put<ChickenYield>(`/master-data/chicken-yields/${id}`, data);
    return response.data;
  },

  updateChickenYieldStatus: async (id: number, status: string): Promise<ChickenYield> => {
    const response = await apiClient.patch<ChickenYield>(`/master-data/chicken-yields/${id}/status`, { status });
    return response.data;
  },

  deleteChickenYield: async (id: number): Promise<void> => {
    await apiClient.delete(`/master-data/chicken-yields/${id}`);
  },
};
